const { Game } = require('../dal/types');
const events = require('../utils/notifications');
const utils = require('../utils/misc');

const get = async (req, res) => {
  if (!isFinite(req.params.gameId)) {
    throw new Error('api.game: gameId not number');
  }

  const gameDetails = await req.dal.game.getGameDetails(req.params.gameId);

  if (!gameDetails || (gameDetails.game.isDisabled() && !gameDetails.game.isAdminUserId(req.userId))) {
    res.status(200).send({
      error: true,
      reason: 'game disabled or not exists',
    });
    return;
  }

  if (gameDetails.game.isAdminUserId(req.userId)) {
    // add players personal data to the response
    const userlist = [].concat(
      gameDetails.players.map(p => p.userId),
      gameDetails.waiters.map(p => p.userId))
      .filter(userId => userId !== 0)
      .reduce((list, userId) => {
        if (list.indexOf(userId) === -1) {
          list.push(userId);
        }
        return list;
      }, []);

    const users = await req.dal.user.getUsers(userlist);
    gameDetails.users = users;
  }

  if (req.userId && gameDetails.game.isPrepay()) {
    const credits = await req.dal.payment.getUserCreditsForOrganizerId(req.userId, gameDetails.game.organizer.userId);
    if (credits && credits.total > 0) {
      gameDetails.creditsTotal = credits.total;
      if (credits.total >= gameDetails.game.paymentAmount) {
        gameDetails.creditsToUse = gameDetails.game.paymentAmount;
      }
      else if (gameDetails.game.paymentAmount - credits.total >= req.dal.payment.MIN_PAYMENT_AMOUNT){
        gameDetails.creditsToUse = credits.total;
      }
      else {
        gameDetails.creditsToUse = gameDetails.game.paymentAmount - req.dal.payment.MIN_PAYMENT_AMOUNT;
      }
    }
  }

  res.status(200).send(gameDetails);
};

// ---------- admin parts -----------------------
const add = async (req, res) => {
  const newGame = req.body;
  req.log.info(`/game/add: ${JSON.stringify(newGame)}`);
  const organizerSettings = await req.dal.user.findOrganizerByUserId(req.userId);
  const place = await req.dal.place.getPlace(newGame.placeId);
  const user = await req.dal.user.getUser(req.userId);

  if (!organizerSettings.adminOf(place.placeId)) {
    req.log.warn(`not game admin (${req.userId}) try to add new game
      ${JSON.stringify(newGame)}`);
    res.status(403).send({
      error: true,
      reason: 'you are not place admin',
    });
    return;
  }

  // check if notify are exists
  const notify = await req.dal.notification.getNotification(newGame.notifyId); // eslint-disable-line no-unused-vars

  const game = new Game({
    chatLink: notify.chatLink,
    date: newGame.date,
    gameId: 0,
    notifyId: Number(newGame.notifyId),
    organizer: user,
    paymentAmount: Number(newGame.paymentAmount),
    paymentGateAccount: newGame.paymentGateAccount,
    paymentGateMessage: newGame.paymentGateMessage,
    paymentMessage: newGame.paymentMessage,
    paymentType: newGame.paymentType,
    hoursBeforeGameRefundAllowed: Number(newGame.hoursBeforeGameRefundAllowed),
    place,
    playerSlots: Number(newGame.playerSlots),
    status: 'disabled',
    timeEnd: newGame.timeEnd,
    timeStart: newGame.timeStart,
    usedPlayerSlots: 0,
    usedWaiterSlots: 0,
    waiterSlots: Number(newGame.waiterSlots),
    openingMode: newGame.openingMode,
    openingDate: newGame.openingDate,
    openingTime: newGame.openingTime,
  });

  if (game.openingMode === 'auto') {
    const dateDiff = utils.compareDates(game.openingDate, game.date);
    const timeDiff = utils.compareTimes(game.openingTime, game.timeStart);
    if (dateDiff === undefined || timeDiff == undefined || dateDiff > 0 || (dateDiff === 0 && timeDiff >= 0)) {
      throw new Error('wrong opening date and time');
    }
  }

  const gameId = await req.dal.game.addGame(game);

  events.emit('game.new', {
    game,
  });

  res.status(200).send({ ok: true, gameId });
};

// TODO: метод отправить нотификацию игрокам без оплаты с определенной игры, перечислите деньги

const getOptions = async (req, res) => {
  const options = [];

  const organizerSettings = await req.dal.user.findOrganizerByUserId(req.userId);
  if (!organizerSettings) {
    res.status(403).send({
      error: true,
      reason: 'you are not any game admin',
    });
    return;
  }

  const places = await req.dal.place.getPlaces(organizerSettings.allowedPlaces());
  if (!places.length) {
    res.status(400).send({
      error: true,
      reason: 'there are no places for you to create new game',
    });
    return;
  }

  options.push({
    label: 'Площадка',
    output: 'placeId',
    type: 'options',
    options: places.map(p => {
      return {
        text: p.title,
        value: p.placeId,
      };
    }),
  });

  options.push({
    label: 'Дата',
    placeholder: 'yyyy-mm-dd',
    output: 'date',
    type: 'date',
  });

  options.push({
    label: 'Начало',
    output: 'timeStart',
    type: 'time',
  });

  options.push({
    label: 'Окончание',
    output: 'timeEnd',
    type: 'time',
  });

  options.push({
    label: 'Количество игроков',
    output: 'playerSlots',
    type: 'number',
  });

  options.push({
    label: 'Количество запасных',
    output: 'waiterSlots',
    type: 'number',
  });

  const notifications = await req.dal.notification.getNotificationsForOrganizerId(req.userId);
  options.push({
    label: 'Схема уведомлений',
    output: 'notifyId',
    type: 'options',
    options: notifications.map(n => {
      return {
        text: n.label,
        value: n.notifyId,
      };
    }),
  });

  const paymentsOptions = [];
  paymentsOptions.push({
    text: 'Ручной режим',
    value: {
      selected: 'manual',
      inputs: [{
        disabled: true,
        hidden: true,
        label: 'Оплата',
        output: 'paymentAmount',
        value: 0,
        type: 'number',
      }, {
        label: 'Сообщение о сумме, когда и как оплачивать',
        output: 'paymentMessage',
        type: 'text',
      }],
    },
  });

  // shared without yandex.money
  paymentsOptions.push({
    text: 'После игры, делится на всех',
    value: {
      selected: 'shared',
      inputs: [{
        label: 'Стоимость зала',
        output: 'paymentAmount',
        type: 'number',
      },{
        label: 'Сообщение об условиях оплаты',
        output: 'paymentMessage',
        type: 'text',
      }],
    }
  });

  const accounts = await req.dal.payment.getPrepayMethodsByOrganizerId(req.userId);
  const idGenerator = (function* () {
    let index = 1;
    yield ''; // if only one account - without index
    while (true) {
      index++;
      yield `(${index})`;
    }
  })();

  if (accounts && accounts.length) {
    for (const account of accounts) {
      const accId = idGenerator.next().value;
      // prepay
      paymentsOptions.push({
        text: `Предоплата ЮMoney ${accId}`,
        value: {
          selected: 'prepay',
          inputs: [{
            disabled: true,
            label: 'Аккаунт ЮMoney',
            output: 'paymentGateAccount',
            value: account.paymentGateAccount,
            type: 'text',
          },{
            disabled: true,
            label: 'Сообщение при оплате',
            output: 'paymentGateMessage',
            value: account.paymentGateMessage,
            type: 'text',
          },{
            // disabled: true,
            label: 'Разрешен возврат, часов до игры',
            output: 'hoursBeforeGameRefundAllowed',
            value: account.hoursBeforeGameRefundAllowed,
            type: 'number',
          },{
            label: 'Сумма с каждого участника',
            output: 'paymentAmount',
            type: 'number',
          }],
        },
      });
      // shared
      paymentsOptions.push({
        text: `Постоплата ЮMoney ${accId}`,
        value: {
          selected: 'shared',
          inputs: [{
            disabled: true,
            label: 'Аккаунт ЮMoney',
            output: 'paymentGateAccount',
            value: account.paymentGateAccount,
            type: 'text',
          },{
            disabled: true,
            label: 'Сообщение при оплате',
            output: 'paymentGateMessage',
            value: account.paymentGateMessage,
            type: 'text',
          },{
            label: 'Сообщение об условиях оплаты',
            output: 'paymentMessage',
            type: 'text',
            value: 'Перевод на ЮMoney, после игры.',
          },{
            label: 'Стоимость зала',
            output: 'paymentAmount',
            type: 'number',
          }],
        }
      });
    }
  }

  options.push({
    label: 'Режим оплаты',
    output: 'paymentType',
    type: 'options',
    options: paymentsOptions,
  });

  // auto game open --------------------------------------
  let gameOpenOptions = [];
  gameOpenOptions.push({
    text: 'Вручную',
    value: {
      selected: 'manual',
    },
  });

  gameOpenOptions.push({
    text: 'Автоматически',
    value: {
      selected: 'auto',
      inputs: [{
        label: 'Дата открытия',
        output: 'openingDate',
        placeholder: 'yyyy-mm-dd',
        type: 'date',
      },{
        label: 'Время открытия',
        output: 'openingTime',
        type: 'time',
      }],
    },
  });

  options.push({
    label: 'Открытие записи',
    output: 'openingMode',
    type: 'options',
    options: gameOpenOptions,
  });

  res.status(200).send(options);
};

const changeStatus = async (req, res) => {
  const { gameId, status } = req.params;
  const gameDetails = await req.dal.game.getGameDetails(gameId);

  if (req.userId !== gameDetails.game.organizer.userId) {
    res.status(403).send({
      error: true,
      reason: 'you are not game admin',
    });
    return;
  }

  gameDetails.game.status = status;
  await req.dal.game.updateGameStatus(gameDetails.game);

  events.emit('game.change.status', {
    game: gameDetails.game,
    status,
  });

  res.status(200).send(gameDetails);
};

const sendPlayerList = async (req, res) => {
  const { gameId } = req.params;
  const gameDetails = await req.dal.game.getGameDetails(gameId);

  if (req.userId !== gameDetails.game.organizer.userId) {
    res.status(403).send({
      error: true,
      reason: 'you are not game admin',
    });
    return;
  }

  const playersList = gameDetails.players
    .filter(rsv => rsv.exists())
    .map(p => p.playerName);

  events.emit('game.players.list', {
    game: gameDetails.game,
    playersList,
  });

  res.status(200).send({ok: true});
};

const askToPay = async (req, res) => {
  const { gameId } = req.params;
  const gameDetails = await req.dal.game.getGameDetails(gameId);

  if (req.userId !== gameDetails.game.organizer.userId) {
    res.status(403).send({
      error: true,
      reason: 'you are not game admin',
    });
    return;
  }

  const playersList = gameDetails.players
    .filter(rsv => rsv.exists() && !rsv.isPaid())
    .map(rsv => rsv.playerName);

  if (playersList.length) {
    events.emit('game.players.ask.to.pay', {
      game: gameDetails.game,
      playersList,
    });
  }

  res.status(200).send({ok: true});
};

const disableAutoOpen = async (req, res) => {
  const { gameId } = req.params;
  const gameDetails = await req.dal.game.getGameDetails(gameId);

  if (req.userId !== gameDetails.game.organizer.userId) {
    res.status(403).send({
      error: true,
      reason: 'you are not game admin',
    });
    return;
  }

  gameDetails.game.openingMode = 'disabled';
  await req.dal.game.updateGameOpenMode(gameDetails.game);

  res.status(200).send(gameDetails);
};

module.exports = {
  add,
  askToPay,
  changeStatus,
  disableAutoOpen,
  get,
  getOptions,
  sendPlayerList,
};

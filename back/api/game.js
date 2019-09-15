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
    place,
    playerSlots: Number(newGame.playerSlots),
    status: 'disabled',
    timeEnd: newGame.timeEnd,
    timeStart: newGame.timeStart,
    usedPlayerSlots: 0,
    usedWaiterSlots: 0,
    waiterSlots: Number(newGame.waiterSlots),
  });

  const gameId = await req.dal.game.addGame(game);

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
    type: 'options',
    options: utils.generateTimeOptions(),
  });

  options.push({
    label: 'Окончание',
    output: 'timeEnd',
    type: 'options',
    options: utils.generateTimeOptions(),
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
    text: 'Стоимость зала делится на всех',
    value: {
      selected: 'shared',
      inputs: [{
        label: 'Стоимость зала',
        output: 'paymentAmount',
        type: 'number',
      },{
        label: 'Сообщение об условиях оплаты, когда и куда переводить деньги',
        output: 'paymentMessage',
        type: 'text',
      }],
    },
  }, {
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
        label: 'Сообщение об условиях оплаты',
        output: 'paymentMessage',
        type: 'text',
      }],
    },
  });
  
  const prepays = await req.dal.payment.getPrepayMethodsByOrganizerId(req.userId);
  for (const prepay of prepays) {
    paymentsOptions.push({
      text: `Предоплата на ${prepay.paymentGateAccount}`,
      value: {
        selected: 'prepay',
        inputs: [{
          disabled: true,
          label: 'Аккаунт Яндекс.Деньги',
          output: 'paymentGateAccount',
          value: prepay.paymentGateAccount,
          type: 'text',
        },{
          disabled: true,
          label: 'Сообщение при оплате',
          output: 'paymentGateMessage',
          value: prepay.paymentGateMessage,
          type: 'text',
        },{
          label: 'Сумма с каждого участника',
          output: 'paymentAmount',
          type: 'number',
        }],
      },
    });
  }
  
  options.push({
    label: 'Режим оплаты',
    output: 'paymentType',
    type: 'options',
    options: paymentsOptions,
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

  const list = gameDetails.players.filter(p => p && p.ts > 0).map(p => p.playerName).join('\n');
 
  events.emit('game.players.list', {
    game: gameDetails.game,
    text: `Список игроков:\n${list}`
  });

  res.status(200).send({ok: true});
};

module.exports = {
  add,
  changeStatus,
  get,
  getOptions,
  sendPlayerList,
};

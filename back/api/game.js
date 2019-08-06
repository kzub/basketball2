const { Game } = require('../dal/types');
const events = require('../utils/notifications');

const get = async (req, res) => {
  if (!isFinite(req.params.gameId)) {
    throw new Error('api.game: gameId not number');
  }

  const gameDetails = await req.dal.game.getGameDetails(req.params.gameId);

  if (!gameDetails || (gameDetails.game.isDisabled() && 
      req.userId !== gameDetails.game.organizer.userId)) {
    res.status(200).send({
      error: true,
      reason: 'game disabled or not exists',
    });
    return;
  }

  if (req.userId === gameDetails.game.organizer.userId) {
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
  const gameData = req.body;
  const organizer = await req.dal.user.findOrganizerByUserId(req.userId);
  const place = await req.dal.place.getPlace(gameData.place.placeId);

  if (!organizer.adminOf(place.placeId)) {
    res.status(403).send({
      error: true,
      reason: 'you are not place admin',
    });
    return;
  }

  // check if notify are exists
  const notify = await req.dal.notification.getNotification(gameData.notifyId); // eslint-disable-line no-unused-vars

  gameData.place = place;
  gameData.organizer = organizer;
  const game = new Game(gameData);

  const gameId = await req.dal.game.addGame(game);

  res.status(200).send({ ok: true, gameId });
};

// TODO: метод отправить нотификацию игрокам без оплаты с определенной игры, перечислите деньги

const getOptions = async (req, res) => {
  const organizer = await req.dal.user.findOrganizerByUserId(req.userId);

  const options = [{
      label: 'Площадка для игры',
      output: 'placeId',
      type: 'options',
      options: [
      {
        text: 'Манхетен',
        value: 1,
      },{
        text: 'Образцова',
        value: 2,
      }],
    },{
      label: 'Дата',
      output: 'date',
      type: 'date',
    },{
      label: 'Начало',
      output: 'timeStart',
      type: 'options',
      options: [{
        text: '09-00',
        value: '09-00',
      },{
        text: '09-15',
        value: '09-15',
      }],
    },{
      label: 'Окончание',
      output: 'timeEnd',
      type: 'options',
      options: [{
        text: '09-00',
        value: '09-00',
      },{
        text: '09-15',
        value: '09-15',
      }],
    },{
      label: 'Количество игроков',
      output: 'playerSlots',
      type: 'number',
    },{
      label: 'Количество запасных',
      output: 'waiterSlots',
      type: 'number',
    },{
      label: 'Схема уведомления',
      output: 'notifyId',
      type: 'options',
      options: [{
        text: 'Группа Playbasket, режим предоплаты',
        value: 1,
      },{
        text: 'Группа Playbasket, все события',
        value: 2,
      },{
        text: 'Тестовый чат, все события',
        value: 3,
      }],
    },{
      label: 'Режим оплаты',
      output: 'paymentType',
      type: 'options',
      options: [{
        text: 'Предоплата на 12313123',
        value: {
          selected: 'prepay',
          inputs: [{
            hidden: true,
            output: 'paymentAccount',
            value: '12313123',
            type: "text",
          },{
            label: "Сумма к предоплате каждому участнику",
            output: "paymentAmount",
            type: "number",
          }],
        },
      },{
        text: 'Делится на всех',
        value: {
          selected: 'shared',
          inputs: [{
            label: "Сумма к оплате со всех",
            output: "paymentAmount",
            type: "number",
          },{
            label: "Сообщение куда и как переводить деньги",
            output: "paymentMessage",
            type: "text",
          }],
        },
      }],
    },
  ];

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

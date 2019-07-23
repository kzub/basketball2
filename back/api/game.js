const { Game } = require('../dal/types');

const get = async (req, res) => {
  if (!isFinite(req.params.gameId)) {
    throw new Error('api.game: gameId not number');
  }

  const gameDetails = await req.dal.game.getGameDetails(req.params.gameId);

  if (req.userId && req.userId === gameDetails.game.organizer.userId) {
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
  // check if place / notify /organizator are exists
  const place = await req.dal.place.getPlace(gameData.placeId);
  const notify = await req.dal.notification.getNotification(gameData.notifyId);
  const organizer = await req.dal.users.findOrganizerByUserId(req.userId);

  if (!organizer.adminOf(place.placeId)) {
    res.status(403).send({
      error: true,
      reason: 'user is not admin of this place',
    });
    return;
  }

  this.gameId             = checkNumber(obj.gameId, 'Game constructor: bad gameId');
  this.playerSlots        = checkNumber(obj.playerSlots, 'Game constructor: bad playerSlots');
  this.usedPlayerSlots    = checkNumber(obj.usedPlayerSlots || 0, 'Game constructor: bad usedPlayerSlots');
  this.freePlayerSlots    = checkNumber(this.playerSlots - this.usedPlayerSlots, 'Game constructor: bad freePlayerSlots');
  this.waiterSlots        = checkNumber(obj.waiterSlots, 'Game constructor: bad waiterSlots');
  this.usedWaiterSlots    = checkNumber(obj.usedWaiterSlots || 0, 'Game constructor: bad usedWaiterSlots');
  this.freeWaiterSlots    = checkNumber(this.waiterSlots - this.usedWaiterSlots, 'Game constructor: bad freeWaiterSlots');
  this.paymentAmount      = checkNumber(obj.paymentAmount, 'Game constructor: bad paymentAmount');
  this.notifyId           = checkNumber(obj.notifyId, 'Game constructor: bad notifyId');

  this.date               = checkString(obj.date, true, 'Game constructor: bad date');
  this.timeStart          = checkString(obj.timeStart, true, 'Game constructor: bad timeStart');
  this.timeEnd            = checkString(obj.timeEnd, true, 'Game constructor: bad timeEnd');
  this.status             = checkString(obj.status, true, 'Game constructor: bad status');
  this.paymentType        = checkString(obj.paymentType, true, 'Game constructor: bad paymentType');
  this.chatLink           = checkString(obj.chatLink, true, 'Game constructor: bad chatLink');

  this.paymentMessage     = checkString(obj.paymentMessage, false, 'Game constructor: bad paymentMessage');
  this.paymentGateMessage = checkString(obj.paymentGateMessage, false, 'Game constructor: bad paymentGateMessage');
  this.paymentGateAccount = checkString(obj.paymentGateAccount, false, 'Game constructor: bad paymentGateAccount');

  const game = new Game({
    gameId: 0,
    status: 'disabled',

    ...gameData,
  });
  const gameDetails = await req.dal.game.getGameDetails(req.params.gameId);

  if (req.userId && req.userId === gameDetails.game.organizer.userId) {
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

module.exports = {
  get,
  add,
};

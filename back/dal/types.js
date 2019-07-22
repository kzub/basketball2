const checkString = (str, msg) => {
  if (!str || !str.length) {
    throw new Error(msg);
  }
};

const checkNumber = (num, msg) => {
  if (typeof(num) !== 'number' || isNaN(num) || !isFinite(num)) {
    throw new Error(msg);
  }
};

function Game (obj) {
  this.gameId = Number(obj.gameId);
  this.date = String(obj.date),
  this.timeStart = String(obj.timeStart);
  this.timeEnd = String(obj.timeEnd);

  this.playerSlots = Number(obj.playerSlots);
  this.usedPlayerSlots = Number(obj.usedPlayerSlots);
  this.freePlayerSlots = this.playerSlots - this.usedPlayerSlots;
  this.waiterSlots = Number(obj.waiterSlots);
  this.usedWaiterSlots = Number(obj.usedWaiterSlots);
  this.freeWaiterSlots = this.waiterSlots - this.usedWaiterSlots;

  this.status = String(obj.status);
  this.paymentType = String(obj.paymentType);
  this.paymentAmount = Number(obj.paymentAmount);
  this.paymentInfo = JSON.parse(obj.paymentInfo);
  this.props = JSON.parse(obj.props);

  this.notifyId = Number(obj.notifyId);
  this.chatLink = String(obj.chatLink);

  this.organizer = obj.organizer;
  this.place = obj.place;

  checkNumber(this.gameId, 'Game constructor: bad gameId');
  checkNumber(this.notifyId, 'Game constructor: bad notifyId');
  checkNumber(this.playerSlots, 'Game constructor: bad playerSlots');
  checkNumber(this.usedPlayerSlots, 'Game constructor: bad usedPlayerSlots');
  checkNumber(this.freePlayerSlots, 'Game constructor: bad freePlayerSlots');
  checkNumber(this.waiterSlots, 'Game constructor: bad waiterSlots');
  checkNumber(this.usedWaiterSlots, 'Game constructor: bad usedWaiterSlots');
  checkNumber(this.freeWaiterSlots, 'Game constructor: bad freeWaiterSlots');
  checkNumber(this.paymentAmount, 'Game constructor: bad paymentAmount');

  checkString(this.chatLink, 'Game constructor: bad chatLink');
  checkString(this.date, 'Game constructor: bad date');
  checkString(this.timeStart, 'Game constructor: bad timeStart');
  checkString(this.timeEnd, 'Game constructor: bad timeEnd');
  checkString(this.status, 'Game constructor: bad status');
  checkString(this.paymentType, 'Game constructor: bad paymentType');

  if (!(this.place instanceof Place)) throw new Error('Game constructor: place not instanceof Place');
  if (!(this.organizer instanceof User)) throw new Error('Game constructor: organizer not instanceof User');
}

Game.prototype.isAdmin = function (user) {
  return this.organizer.userId === user.userId;
};

Game.prototype.isPrepay =function  () {
  return this.paymentType === 'prepay';
};

Game.prototype.freeSlotExists = function (slotType) {
  return (
    (slotType === 'player' && this.freePlayerSlots > 0) ||
    (slotType === 'waiter' && this.freeWaiterSlots > 0)
  );
};

function GameDetails (game, players, waiters) {
  this.game = game;
  this.players = players;
  this.waiters = waiters;

  if (!(this.game instanceof Game)) throw new Error('GameDetails constructor: game not instanceof Game');
  if (!(this.players instanceof Array) ||
    !this.players.reduce((acc, booking) => acc && (booking instanceof Reservation), true)) {
    throw new Error('GameDetails constructor: players not instanceof Reservation');
  }
  if (!(this.waiters instanceof Array) ||
    !this.waiters.reduce((acc, booking) => acc && (booking instanceof Reservation), true)) {
    throw new Error('GameDetails constructor: waiters not instanceof Reservation');
  }

  for (let i = players.length; i < game.playerSlots; i++) {
    this.players.push(new Reservation({
      ts: 0,
      bookId: 0,
      gameId: game.gameId,
      userId: 0,
      playerName: 'Забронировать',
      paymentAmount: 0,
      paymentStatus: 'unpaid',
      status: 'free4player',
      expireAt: 0,
    }));
  }

  for (let i = waiters.length; i < game.waiterSlots; i++) {
    this.waiters.push(new Reservation({
      ts: 0,
      bookId: 0,
      gameId: game.gameId,
      userId: 0,
      playerName: 'Занять очередь',
      paymentAmount: 0,
      paymentStatus: 'unpaid',
      status: 'free4waiter',
    }));
  }

}

function Place (obj) {
  this.placeId = Number(obj.placeId);
  this.title = String(obj.title);
  this.description = String(obj.description);
  this.howToGet = String(obj.howToGet);
  this.position = JSON.parse(obj.position);

  checkNumber(this.placeId, 'Place constructor: bad placeId');

  checkString(this.title, 'Place constructor: bad title');
  checkString(this.description, 'Place constructor: bad description');
  checkString(this.howToGet, 'Place constructor: bad howToGet');
  
  if (!this.position.lat || !this.position.lng) throw new Error('Place constructor: bad position');
}

function User (obj) {
  this.userId = Number(obj.userId);
  this.name = String(obj.name);
  this.phone = String(obj.phone);

  if (typeof(this.userId) !== 'number' || isNaN(this.userId)) throw new Error('User constructor: bad userId');
  if (!this.phone.length) throw new Error('User constructor: bad phone');
  this.phone = `+${this.phone}`;
}

function Reservation (obj) {
  this.ts = Number(obj.ts);
  this.bookId = Number(obj.bookId);
  this.gameId = Number(obj.gameId);
  this.userId = Number(obj.userId);
  this.playerName = String(obj.playerName);
  this.paymentAmount = Number(obj.paymentAmount);
  this.paymentStatus = String(obj.paymentStatus);
  this.paymentId = obj.paymentId !== undefined && Number(obj.paymentId);
  this.status = String(obj.status);
  this.expireAt = Number(obj.expireAt || 0);

  checkNumber(this.ts, 'Reservation constructor: bad ts');
  checkNumber(this.bookId, 'Reservation constructor: bad bookId');
  checkNumber(this.gameId, 'Reservation constructor: bad gameId');
  checkNumber(this.userId, 'Reservation constructor: bad userId');
  checkNumber(this.paymentAmount, 'Reservation constructor: bad paymentAmount');
  checkNumber(this.paymentId||0, 'Reservation constructor: bad paymentId');
  checkNumber(this.expireAt, 'Reservation constructor: bad expireAt');

  checkString(this.playerName, 'Reservation constructor: bad playerName');
  checkString(this.paymentStatus, 'Reservation constructor: bad paymentStatus');
  checkString(this.status, 'Reservation constructor: bad status');
}

Reservation.prototype.isOwner = function (user) {
  return user.userId === this.userId;
};

Reservation.prototype.isPaid = function () {
  return this.paymentStatus === 'paid';
};

Reservation.prototype.setExpire = function (time) {
  this.expireAt = time;
};

Reservation.prototype.makePaid = function (amount) {
  if (typeof(amount) === 'number' && !isNaN(amount)) {
    this.paymentAmount = amount;
  }
  this.paymentStatus = 'paid';
};

Reservation.prototype.makeUnpaid = function () {
  this.paymentStatus = 'unpaid';
};

Reservation.prototype.realPaymentComplete = function () {
  return this.paymentId > 0;
};

Reservation.prototype.reserve = function () {
  this.status = 'reserved';
};

Reservation.prototype.cancel = function () {
  this.status = 'canceled';
};

Reservation.prototype.book = function () {
  this.status = 'booked';
};


function Notification (obj) {
  this.notifyId = Number(obj.notifyId);
  this.organizerId = Number(obj.organizerId);

  this.botToken = String(obj.botToken);
  this.adminChatId = String(obj.adminChatId);
  this.userChatId = String(obj.userChatId);
  this.userEvents =
    obj.userEvents
      .split(',')
      .reduce((acc, elm) => {
        acc[elm] = true;
        return acc;
      }, {});

  checkNumber(this.notifyId, 'Notification constructor: bad notifyId');
  checkNumber(this.organizerId, 'Notification constructor: bad organizerId');

  checkString(this.botToken, 'Notification constructor: bad botToken');
  checkString(this.userChatId, 'Notification constructor: bad userChatId');
  checkString(this.adminChatId, 'Notification constructor: bad adminChatId');
}

Notification.prototype.getChatId = function (event) {
  if (this.userEvents[event]) {
    return this.userChatId;
  }
  return this.adminChatId;
};

module.exports = {
  Game,
  Reservation,
  GameDetails,
  Notification,
  Place,
  User,
};

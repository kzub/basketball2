const checkString = (str, required, msg) => {
  if (required && (typeof(str) !== 'string' || !str.length)) {
    throw new Error(msg);
  }
  if (str && typeof(str) !== 'string') {
    throw new Error(msg);
  }
  return str;
};

const checkTime = (str, required, msg) => {
  if (required && (typeof(str) !== 'string' || str.length !== 5)) {
    throw new Error(msg);
  }
  if (str && (typeof(str) !== 'string' || str.length !== 5)) {
    throw new Error(msg);
  }
  return str;
};

const checkNumber = (num, required, msg) => {
  if (required && typeof(num) !== 'number' || isNaN(num) || !isFinite(num)) {
    throw new Error(msg);
  }
  if (num !== undefined && typeof(num) !== 'number' || isNaN(num) || !isFinite(num)) {
    throw new Error(msg);
  }
  return num;
};

const checkDate = (str, required, msg) => {
  if(!str && !required) { return; }
  const date = checkString(str, required, msg);
  let check = new Date(date);
  if (isNaN(check.valueOf())) {
    throw new Error(msg);
  }
  return check.toJSON().slice(0,10);
};

function Game (obj) {
  this.gameId             = checkNumber(obj.gameId, true, 'Game constructor: bad gameId');
  this.playerSlots        = checkNumber(obj.playerSlots, true, 'Game constructor: bad playerSlots');
  this.usedPlayerSlots    = checkNumber(obj.usedPlayerSlots || 0, true, 'Game constructor: bad usedPlayerSlots');
  this.freePlayerSlots    = checkNumber(this.playerSlots - this.usedPlayerSlots, true, 'Game constructor: bad freePlayerSlots');
  this.waiterSlots        = checkNumber(obj.waiterSlots, true, 'Game constructor: bad waiterSlots');
  this.usedWaiterSlots    = checkNumber(obj.usedWaiterSlots || 0, true, 'Game constructor: bad usedWaiterSlots');
  this.freeWaiterSlots    = checkNumber(this.waiterSlots - this.usedWaiterSlots, true, 'Game constructor: bad freeWaiterSlots');
  this.paymentAmount      = checkNumber(obj.paymentAmount, true, 'Game constructor: bad paymentAmount');
  this.notifyId           = checkNumber(obj.notifyId, true, 'Game constructor: bad notifyId');
  this.hoursBeforeGameRefundAllowed
                          = checkNumber(obj.hoursBeforeGameRefundAllowed || 0, true, 'Game constructor: bad hoursBeforeGameRefundAllowed');

  this.date               = checkDate(obj.date, true, 'Game constructor: bad date');
  this.timeStart          = checkTime(obj.timeStart, true, 'Game constructor: bad timeStart');
  this.timeEnd            = checkTime(obj.timeEnd, true, 'Game constructor: bad timeEnd');
  this.status             = checkString(obj.status, true, 'Game constructor: bad status');
  this.paymentType        = checkString(obj.paymentType, true, 'Game constructor: bad paymentType');
  this.chatLink           = checkString(obj.chatLink, false, 'Game constructor: bad chatLink');

  this.paymentMessage     = checkString(obj.paymentMessage, false, 'Game constructor: bad paymentMessage');
  this.paymentGateMessage = checkString(obj.paymentGateMessage, false, 'Game constructor: bad paymentGateMessage');
  this.paymentGateAccount = checkString(obj.paymentGateAccount, false, 'Game constructor: bad paymentGateAccount');

  this.openingMode        = checkString(obj.openingMode, true, 'Game constructor: bad openingMode');
  this.openingDate        = checkDate(obj.openingDate, false, 'Game constructor: bad openingDate');
  this.openingTime        = checkTime(obj.openingTime, false, 'Game constructor: bad openingTime');

  this.organizer = obj.organizer;
  this.place = obj.place;

  if (this.isTimePassed()) {
    this.status = 'past';
  }

  if (!(this.place instanceof Place)) throw new Error('Game constructor: place not instanceof Place');
  if (!(this.organizer instanceof User)) throw new Error('Game constructor: organizer not instanceof User');
}

Game.prototype.isAdminUser = function (user) {
  return this.organizer.userId === user.userId;
};

Game.prototype.isAdminUserId = function (userId) {
  return this.organizer.userId === userId;
};

Game.prototype.isAutoOpening = function () {
  return this.openingMode === 'auto';
};

Game.prototype.isDisabled = function () {
  return this.status === 'disabled';
};

Game.prototype.isPrepay = function () {
  return this.paymentType === 'prepay';
};

Game.prototype.isSharedPay = function () {
  return this.paymentType === 'shared';
};

Game.prototype.isPayAfter = function () {
  return this.paymentType === 'payafter';
};

Game.prototype.isPayWithPG = function () {
  return this.paymentGateAccount != '';
};

Game.prototype.paymentAmountPerPlayer = function () {
  if (this.paymentType == 'shared') {
    return Math.ceil(this.paymentAmount / this.usedPlayerSlots);
  }
  return this.paymentAmount;
};

Game.prototype.hoursToGameBegin = function () {
  const tsGameStart = (new Date(`${this.date}T${this.timeStart}:00+0300`)).valueOf();
  const hoursToGameBegin = Math.ceil((tsGameStart - Date.now())/1000/60/60);
  return hoursToGameBegin;
};

Game.prototype.isRefundAllowed = function () {
  return this.isPayWithPG() && (this.hoursToGameBegin() > this.hoursBeforeGameRefundAllowed);
};

Game.prototype.isTimePassed = function () {
  const tsGameEnd = (new Date(`${this.date}T${this.timeEnd}:00+0300`)).valueOf();
  return Date.now() > tsGameEnd;
};

Game.prototype.freeSlotExists = function (slotType) {
  return (
    (slotType === 'player' && this.freePlayerSlots > 0) ||
    (slotType === 'waiter' && this.freeWaiterSlots > 0)
  );
};

Game.prototype.waiterReservationTTL = function () {
  if (this.isPrepay()) {
    if (this.hoursToGameBegin() > 24) {
      return Date.now() + 12*60*60*1000;
    }
    return Date.now() + 2*60*60*1000;
  }
  return 0;
};

Game.prototype.newReservationTTL = function (slotType) {
  if (slotType !== 'player') {
    return 0;
  }
  if (this.isPrepay()) {
    if (this.hoursToGameBegin() > 24) {
      return Date.now() + 4*60*60*1000;
    }
    return Date.now() + 1*60*60*1000;
  }
  return 0;
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
  this.placeId     = checkNumber(obj.placeId, true, 'Place constructor: bad placeId');
  this.lng         = checkNumber(obj.lng, true, 'Place constructor: bad lng');
  this.lat         = checkNumber(obj.lat, true, 'Place constructor: bad lat');

  this.title       = checkString(obj.title, true, 'Place constructor: bad title');
  this.description = checkString(obj.description, true, 'Place constructor: bad description');
  this.howToGet    = checkString(obj.howToGet, true, 'Place constructor: bad howToGet');
}

function User (obj) {
  this.userId = checkNumber(obj.userId, true, 'User constructor: bad userId');
  this.name = checkString(obj.name, false, 'User constructor: bad name');
  this.phone = checkString(obj.phone, true, 'User constructor: bad phone');
  if (obj.isOrganizer) {
    this.isOrganizer = true;
  }
  if (obj.hasYM) {
    this.hasYM = true;
  }
  this.phone = `+${this.phone}`;
}

function Reservation (obj) {
  this.ts            = checkNumber(obj.ts, true, 'Reservation constructor: bad ts');
  this.bookId        = checkNumber(obj.bookId, true, 'Reservation constructor: bad bookId');
  this.gameId        = checkNumber(obj.gameId, true, 'Reservation constructor: bad gameId');
  this.userId        = checkNumber(obj.userId, true, 'Reservation constructor: bad userId');
  this.paymentAmount = checkNumber(obj.paymentAmount, true, 'Reservation constructor: bad paymentAmount');
  this.expireAt      = checkNumber(obj.expireAt || 0, true, 'Reservation constructor: bad expireAt');
  this.paymentId     = obj.paymentId && checkNumber(obj.paymentId, true, 'Reservation constructor: bad paymentId');

  this.playerName    = checkString(obj.playerName, true, 'Reservation constructor: bad playerName');
  this.paymentStatus = checkString(obj.paymentStatus, true, 'Reservation constructor: bad paymentStatus');
  this.status        = checkString(obj.status, true, 'Reservation constructor: bad status');
}

Reservation.prototype.exists = function () {
  return this.ts > 0;
};

Reservation.prototype.isOwnerUser = function (user) {
  return this.userId === user.userId;
};

Reservation.prototype.isOwnerUserId = function (userId) {
  return this.userId === userId;
};

Reservation.prototype.isPaid = function () {
  return this.paymentStatus === 'paid';
};

Reservation.prototype.isWaiter = function () {
  return this.status === 'waiting';
};

Reservation.prototype.isPlayer = function () {
  return this.status === 'reserved';
};

Reservation.prototype.isCanceled = function () {
  return this.status === 'canceled';
};

Reservation.prototype.setExpire = function (time) {
  this.expireAt = time;
};

Reservation.prototype.isExpired = function () {
  return (this.expireAt > 0) && (Date.now() > this.expireAt);
};

Reservation.prototype.makePaid = function (amount) {
  if (isFinite(amount)) {
    this.paymentAmount = Number(amount);
  }
  this.paymentStatus = 'paid';
};

Reservation.prototype.makeUnpaid = function () {
  this.paymentStatus = 'unpaid';
};

Reservation.prototype.realPaymentComplete = function () {
  return this.paymentId > 0;
};

Reservation.prototype.cancel = function () {
  this.ts = Date.now();
  this.status = 'canceled';
};

function Notification (obj) {
  this.notifyId    = checkNumber(obj.notifyId, true, 'Notification constructor: bad notifyId');

  this.botToken    = checkString(obj.botToken, true, 'Notification constructor: bad botToken');
  this.adminChatId = checkString(obj.adminChatId, true, 'Notification constructor: bad adminChatId');
  this.userChatId  = checkString(obj.userChatId, true, 'Notification constructor: bad userChatId');
  this.userEvents  = checkString(obj.userEvents, false, 'Notification constructor: bad userChatId')
    .split(',')
    .reduce((acc, elm) => {
      acc[elm] = true;
      return acc;
    }, {});
  this.chatLink = checkString(obj.chatLink, false, 'Notification constructor: bad chatLink');
  this.label    = checkString(obj.label, true, 'Notification constructor: bad label');
}

Notification.prototype.getChatId = function (event) {
  if (this.userEvents['*']) {
    return this.userChatId;
  }
  if (this.userEvents[event]) {
    return this.userChatId;
  }
  return this.adminChatId;
};

function OrganizerSettings (organizerId, places, yandexMoneys) {
  this.organizerId = checkNumber(organizerId, true, 'OrganizerSettings constructor: bad organizerId');
  this.YMs = yandexMoneys.map(ym => {
    return {
      paySystem: checkString(ym.paySystem, true, 'OrganizerSettings constructor: bad paySystem'),
      paymentGateAccount: checkString(ym.paymentGateAccount, true, 'OrganizerSettings constructor: bad paymentGateAccount'),
      paymentGateMessage: checkString(ym.paymentGateMessage, true, 'OrganizerSettings constructor: bad paymentGateMessage'),
    };
  });
  this.placesIds = places.map(p => checkNumber(p.placeId, true, 'OrganizerSettings constructor: bad placeId'));
}

OrganizerSettings.prototype.adminOf = function (placeId) {
  return this.placesIds.indexOf(placeId) >= 0;
};

OrganizerSettings.prototype.allowedPlaces = function () {
  return this.placesIds.slice();
};

function Transfer (obj) {
  this.transferCode = checkString(obj.transferCode, true, 'Transfer constructor: bad transferCode');
  this.created      = checkDate(obj.created, true, 'Transfer constructor: bad created');
  this.bookId       = checkNumber(obj.bookId, true, 'Transfer constructor: bad bookId');
  this.gameId       = checkNumber(obj.gameId, true, 'Transfer constructor: bad gameId');
  this.playerId      = checkNumber(obj.playerId, true, 'Transfer constructor: bad playerId');
  this.newPlayerId   = this.newPlayerId && checkNumber(obj.newPlayerId, true, 'Transfer constructor: bad newPlayerId');
  this.executedAt   = checkDate(obj.executedAt, false, 'Transfer constructor: bad executedAt');
}

module.exports = {
  Game,
  GameDetails,
  Notification,
  OrganizerSettings,
  Place,
  Reservation,
  Transfer,
  User,
};

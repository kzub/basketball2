const checkString = (str, required, msg) => {
  if (required && (typeof(str) !== 'string' || !str.length)) {
    throw new Error(msg);
  }
  if (str && typeof(str) !== 'string') {
    throw new Error(msg); 
  }
  return str;
};

const checkNumber = (num, msg) => {
  if (typeof(num) !== 'number' || isNaN(num) || !isFinite(num)) {
    throw new Error(msg);
  }
  return num;
};

const checkDate = (str, required, msg) => {
  const date = checkString(str, required, msg);
  let check = new Date(date);
  if (isNaN(check.valueOf())) {
    throw new Error(msg);
  }
  return check.toJSON().slice(0,10);
};

function Game (obj) {
  this.gameId             = checkNumber(obj.gameId, 'Game constructor: bad gameId');
  this.playerSlots        = checkNumber(obj.playerSlots, 'Game constructor: bad playerSlots');
  this.usedPlayerSlots    = checkNumber(obj.usedPlayerSlots || 0, 'Game constructor: bad usedPlayerSlots');
  this.freePlayerSlots    = checkNumber(this.playerSlots - this.usedPlayerSlots, 'Game constructor: bad freePlayerSlots');
  this.waiterSlots        = checkNumber(obj.waiterSlots, 'Game constructor: bad waiterSlots');
  this.usedWaiterSlots    = checkNumber(obj.usedWaiterSlots || 0, 'Game constructor: bad usedWaiterSlots');
  this.freeWaiterSlots    = checkNumber(this.waiterSlots - this.usedWaiterSlots, 'Game constructor: bad freeWaiterSlots');
  this.paymentAmount      = checkNumber(obj.paymentAmount, 'Game constructor: bad paymentAmount');
  this.notifyId           = checkNumber(obj.notifyId, 'Game constructor: bad notifyId');
  
  this.date               = checkDate(obj.date, true, 'Game constructor: bad date');
  this.timeStart          = checkString(obj.timeStart, true, 'Game constructor: bad timeStart');
  this.timeEnd            = checkString(obj.timeEnd, true, 'Game constructor: bad timeEnd');
  this.status             = checkString(obj.status, true, 'Game constructor: bad status');
  this.paymentType        = checkString(obj.paymentType, true, 'Game constructor: bad paymentType');
  this.chatLink           = checkString(obj.chatLink, true, 'Game constructor: bad chatLink');
  
  this.paymentMessage     = checkString(obj.paymentMessage, false, 'Game constructor: bad paymentMessage');
  this.paymentGateMessage = checkString(obj.paymentGateMessage, false, 'Game constructor: bad paymentGateMessage');
  this.paymentGateAccount = checkString(obj.paymentGateAccount, false, 'Game constructor: bad paymentGateAccount');

  this.organizer = obj.organizer;
  this.place = obj.place;

  if (!(this.place instanceof Place)) throw new Error('Game constructor: place not instanceof Place');
  if (!(this.organizer instanceof User)) throw new Error('Game constructor: organizer not instanceof User');
}

Game.prototype.isAdmin = function (user) {
  return this.organizer.userId === user.userId;
};

Game.prototype.isDisabled = function () {
  return this.status === 'disabled';
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
  this.placeId     = checkNumber(obj.placeId, 'Place constructor: bad placeId');
  this.lng         = checkNumber(obj.lng, 'Place constructor: bad lng');
  this.lat         = checkNumber(obj.lat, 'Place constructor: bad lat');
  
  this.title       = checkString(obj.title, true, 'Place constructor: bad title');
  this.description = checkString(obj.description, true, 'Place constructor: bad description');
  this.howToGet    = checkString(obj.howToGet, true, 'Place constructor: bad howToGet');
}

function User (obj) {
  this.userId = checkNumber(obj.userId, 'User constructor: bad userId');
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
  this.ts            = checkNumber(obj.ts, 'Reservation constructor: bad ts');
  this.bookId        = checkNumber(obj.bookId, 'Reservation constructor: bad bookId');
  this.gameId        = checkNumber(obj.gameId, 'Reservation constructor: bad gameId');
  this.userId        = checkNumber(obj.userId, 'Reservation constructor: bad userId');
  this.paymentAmount = checkNumber(obj.paymentAmount, 'Reservation constructor: bad paymentAmount');
  this.expireAt      = checkNumber(obj.expireAt || 0, 'Reservation constructor: bad expireAt');
  this.paymentId     = obj.paymentId && checkNumber(obj.paymentId, 'Reservation constructor: bad paymentId');
  
  this.playerName    = checkString(obj.playerName, true, 'Reservation constructor: bad playerName');
  this.paymentStatus = checkString(obj.paymentStatus, true, 'Reservation constructor: bad paymentStatus');
  this.status        = checkString(obj.status, true, 'Reservation constructor: bad status');
}

Reservation.prototype.isOwner = function (user) {
  return user.userId === this.userId;
};

Reservation.prototype.isPaid = function () {
  return this.paymentStatus === 'paid';
};

Reservation.prototype.isWaiter = function () {
  return this.status === 'waiting';
};

Reservation.prototype.setExpire = function (time) {
  this.expireAt = time;
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
  this.notifyId    = checkNumber(obj.notifyId, 'Notification constructor: bad notifyId');

  this.botToken    = checkString(obj.botToken, true, 'Notification constructor: bad botToken');
  this.adminChatId = checkString(obj.adminChatId, true, 'Notification constructor: bad adminChatId');
  this.userChatId  = checkString(obj.userChatId, true, 'Notification constructor: bad userChatId');
  this.userEvents  = checkString(obj.userEvents, false, 'Notification constructor: bad userChatId')
    .split(',')
    .reduce((acc, elm) => {
      acc[elm] = true;
      return acc;
    }, {});
  this.chatLink = checkString(obj.chatLink, true, 'Notification constructor: bad chatLink');
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
  this.organizerId = checkNumber(organizerId, 'OrganizerSettings constructor: bad organizerId');
  this.YMs = yandexMoneys.map(ym => {
    return {
      paySystem: checkString(ym.paySystem, true, 'OrganizerSettings constructor: bad paySystem'),
      paymentGateAccount: checkString(ym.paymentGateAccount, true, 'OrganizerSettings constructor: bad paymentGateAccount'),
      paymentGateMessage: checkString(ym.paymentGateMessage, true, 'OrganizerSettings constructor: bad paymentGateMessage'),
    };
  });
  this.placesIds = places.map(p => checkNumber(p.placeId, 'OrganizerSettings constructor: bad placeId'));
}

OrganizerSettings.prototype.adminOf = function (placeId) {
  return this.placesIds.indexOf(placeId) >= 0;
};

OrganizerSettings.prototype.allowedPlaces = function () {
  return this.placesIds.slice();
};

const newReservationTTL = 30*60*1000;
const waiterReservationTTL = 240*60*1000;

module.exports = {
  Game,
  GameDetails,
  newReservationTTL,
  Notification,
  OrganizerSettings,
  Place,
  Reservation,
  User,
  waiterReservationTTL,
};

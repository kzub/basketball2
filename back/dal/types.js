const checkString = (str, msg) => {
  if (!str || !str.length) {
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
  this.props = JSON.parse(obj.props);

  this.organizer = obj.organizer;
  this.place = obj.place;

  if (typeof(this.gameId) !== 'number' || isNaN(this.gameId)) throw new Error('Game constructor: bad gameId');
  if (typeof(this.playerSlots) !== 'number' || isNaN(this.playerSlots)) throw new Error('Game constructor: bad playerSlots');
  if (typeof(this.usedPlayerSlots) !== 'number' || isNaN(this.usedPlayerSlots)) throw new Error('Game constructor: bad usedPlayerSlots');
  if (typeof(this.freePlayerSlots) !== 'number' || isNaN(this.freePlayerSlots)) throw new Error('Game constructor: bad freePlayerSlots');
  if (typeof(this.waiterSlots) !== 'number' || isNaN(this.waiterSlots)) throw new Error('Game constructor: bad waiterSlots');
  if (typeof(this.usedWaiterSlots) !== 'number' || isNaN(this.usedWaiterSlots)) throw new Error('Game constructor: bad usedWaiterSlots');
  if (typeof(this.freeWaiterSlots) !== 'number' || isNaN(this.freeWaiterSlots)) throw new Error('Game constructor: bad freeWaiterSlots');

  if (typeof(this.paymentAmount) !== 'number' || isNaN(this.paymentAmount)) throw new Error('Game constructor: bad paymentAmount');

  checkString(obj.date, 'Game constructor: bad date');
  checkString(obj.timeStart, 'Game constructor: bad timeStart');
  checkString(obj.timeEnd, 'Game constructor: bad timeEnd');
  checkString(obj.status, 'Game constructor: bad status');
  checkString(obj.paymentType, 'Game constructor: bad paymentType');

  if (!(this.place instanceof Place)) throw new Error('Game constructor: place not instanceof Place');
  if (!(this.organizer instanceof User)) throw new Error('Game constructor: organizer not instanceof User');
}

Game.prototype.isAdmin = function (user) {
  return this.organizer.userId === user.userId;
};

Game.prototype.isPrepay = function () {
  return this.paymentType === 'prepay';
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

  players = players.map(p => {
    if (game.isPrepay() && !p.isPaid()) {
      p.setExpire(game.props.reservationExpire || 30*60*1000);
    }
    return p;
  });

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
  this.link = String(obj.link);
  this.position = String(obj.position);

  if (typeof(this.placeId) !== 'number' || isNaN(this.placeId)) throw new Error('Place constructor: bad placeId');
  if (!this.title.length) throw new Error('Place constructor: bad title');
  if (!this.description.length) throw new Error('Place constructor: bad description');
  if (!this.link.length) throw new Error('Place constructor: bad link');
  if (!this.position.length) throw new Error('Place constructor: bad position');
}

function User (obj) {
  this.userId = Number(obj.userId);
  this.name = String(obj.name);
  this.phone = String(obj.phone);

  if (typeof(this.userId) !== 'number' || isNaN(this.userId)) throw new Error('User constructor: bad userId');
  if (!this.name.length) throw new Error('User constructor: bad name');
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
  this.status = String(obj.status);
  this.expireTime = 0;

  if (typeof(this.ts) !== 'number' || isNaN(this.ts)) throw new Error('Reservation constructor: bad ts');
  if (typeof(this.bookId) !== 'number' || isNaN(this.bookId)) throw new Error('Reservation constructor: bad bookId');
  if (typeof(this.gameId) !== 'number' || isNaN(this.gameId)) throw new Error('Reservation constructor: bad gameId');
  if (typeof(this.userId) !== 'number' || isNaN(this.userId)) throw new Error('Reservation constructor: bad userId');
  if (typeof(this.paymentAmount) !== 'number' || isNaN(this.paymentAmount)) throw new Error('Reservation constructor: bad paymentAmount');

  checkString(obj.playerName, 'Reservation constructor: bad playerName');
  checkString(obj.paymentStatus, 'Reservation constructor: bad paymentStatus');
  checkString(obj.status, 'Reservation constructor: bad status');
}

Reservation.prototype.isOwner = function(user) {
  return user.userId === this.userId;
};

Reservation.prototype.setExpire = function(time) {
  return this.expireTime = this.ts + time;
};

Reservation.prototype.isPaid = function() {
  return this.paymentStatus === 'paid';
};

module.exports = {
  Game,
  Reservation,
  GameDetails,
  Place,
  User,
};

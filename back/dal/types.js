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

  this.status = String(obj.status);
  this.paymentType = String(obj.paymentType);
  this.paymentAmount = Number(obj.paymentAmount);
  this.props = JSON.parse(obj.props);

  this.organizer = obj.organizer;
  this.place = obj.place;

  if (typeof(this.gameId) !== 'number' || isNaN(this.gameId)) throw new Error(`Game constructor: bad gameId`);
  if (typeof(this.playerSlots) !== 'number' || isNaN(this.playerSlots)) throw new Error(`Game constructor: bad playerSlots`);
  if (typeof(this.usedPlayerSlots) !== 'number' || isNaN(this.usedPlayerSlots)) throw new Error(`Game constructor: bad usedPlayerSlots`);
  if (typeof(this.freePlayerSlots) !== 'number' || isNaN(this.freePlayerSlots)) throw new Error(`Game constructor: bad freePlayerSlots`);
  if (typeof(this.waiterSlots) !== 'number' || isNaN(this.waiterSlots)) throw new Error(`Game constructor: bad waiterSlots`);

  if (typeof(this.paymentAmount) !== 'number' || isNaN(this.paymentAmount)) throw new Error(`Game constructor: bad paymentAmount`);

  checkString(obj.date, `Game constructor: bad date`);
  checkString(obj.timeStart, `Game constructor: bad timeStart`);
  checkString(obj.timeEnd, `Game constructor: bad timeEnd`);
  checkString(obj.status, `Game constructor: bad status`);
  checkString(obj.paymentType, `Game constructor: bad paymentType`);

  if (!(this.place instanceof Place)) throw new Error('Game constructor: place not instanceof Place');
  if (!(this.organizer instanceof User)) throw new Error('Game constructor: organizer not instanceof User');
}

function GameDetails (game, players, waiters) {
  this.game = game;
  this.players = players;
  this.waiters = waiters;

  if (!(this.game instanceof Game)) throw new Error('GameDetails constructor: game not instanceof Game');
  if (!(this.players instanceof Array) || 
    !this.players.reduce((acc, booking) => acc && (booking instanceof GameSlot), true)) {
    throw new Error('GameDetails constructor: players not instanceof GameSlot');
  }
  if (!(this.waiters instanceof Array) || 
    !this.waiters.reduce((acc, booking) => acc && (booking instanceof GameSlot), true)) {
    throw new Error('GameDetails constructor: waiters not instanceof GameSlot');
  }

  for (let i = players.length; i < game.playerSlots; i++) {
    this.players.push(new GameSlot({
      ts: 0,
      bookId: 0,
      gameId: game.gameId,
      userId: 0,
      playerName: 'Забронировать',
      paymentAmount: 0,
      paymentStatus: 'unpaid',
      type: 'player',
      status: 'free',
    }))
  }

  for (let i = waiters.length; i < game.waiterSlots; i++) {
    this.waiters.push(new GameSlot({
      ts: 0,
      bookId: 0,
      gameId: game.gameId,
      userId: 0,
      playerName: 'Занять очередь',
      paymentAmount: 0,
      paymentStatus: 'unpaid',
      type: 'waiter',
      status: 'free',
    }))
  }
  
}

function Place (obj) {
  this.placeId = Number(obj.placeId);
  this.title = String(obj.title);
  this.description = String(obj.description);
  this.link = String(obj.link);
  this.position = String(obj.position);

  if (typeof(this.placeId) !== 'number' || isNaN(this.placeId)) throw new Error(`Place constructor: bad placeId`);
  if (!this.title.length) throw new Error(`Place constructor: bad title`);
  if (!this.description.length) throw new Error(`Place constructor: bad description`);
  if (!this.link.length) throw new Error(`Place constructor: bad link`);
  if (!this.position.length) throw new Error(`Place constructor: bad position`);
}

function User (obj) {
  this.userId = Number(obj.userId);
  this.name = String(obj.name);
  this.phone = String(obj.phone);

  if (typeof(this.userId) !== 'number' || isNaN(this.userId)) throw new Error(`User constructor: bad userId`);
  if (!this.name.length) throw new Error(`User constructor: bad name`);
  if (!this.phone.length) throw new Error(`User constructor: bad phone`);
}

function GameSlot (obj) {
  this.ts = Number(obj.ts);
  this.bookId = Number(obj.bookId);
  this.gameId = Number(obj.gameId);
  this.userId = Number(obj.userId);
  this.playerName = String(obj.playerName);
  this.paymentAmount = Number(obj.paymentAmount);
  this.paymentStatus = String(obj.paymentStatus);
  this.type = String(obj.type);
  this.status = String(obj.status);

  if (typeof(this.ts) !== 'number' || isNaN(this.ts)) throw new Error(`GameSlot constructor: bad ts`);
  if (typeof(this.bookId) !== 'number' || isNaN(this.bookId)) throw new Error(`GameSlot constructor: bad bookId`);
  if (typeof(this.gameId) !== 'number' || isNaN(this.gameId)) throw new Error(`GameSlot constructor: bad gameId`);
  if (typeof(this.userId) !== 'number' || isNaN(this.userId)) throw new Error(`GameSlot constructor: bad userId`);
  if (typeof(this.paymentAmount) !== 'number' || isNaN(this.paymentAmount)) throw new Error(`GameSlot constructor: bad paymentAmount`);

  checkString(obj.playerName, `GameSlot constructor: bad playerName`);
  checkString(obj.paymentStatus, `GameSlot constructor: bad paymentStatus`);
  checkString(obj.type, `GameSlot constructor: bad type`);
  checkString(obj.status, `GameSlot constructor: bad status`);
}


module.exports = {
  Game,
  GameSlot,
  GameDetails,
  Place,
  User,
};

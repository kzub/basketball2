const utils = require('../utils/misc');
const { Game, GameDetails, Reservation, Place } = require('./types');

let log; // eslint-disable-line
let dal; // eslint-disable-line
let execSQL;

const getGame = async (gameId) => {
  const games = await execSQL.all(`SELECT g.*, usedPlayerSlots, usedWaiterSlots, chatLink FROM games g
    LEFT JOIN (
      SELECT gameId, count(*) usedPlayerSlots from bookings
      WHERE status IN ('booked', 'reserved')
      AND gameId = ${gameId}
      GROUP BY gameId
    ) bk ON g.gameId = bk.gameId
    LEFT JOIN (
      SELECT gameId, count(*) usedWaiterSlots from bookings
      WHERE status = 'waiting'
      AND gameId = ${gameId}
      GROUP BY gameId
    ) bkw ON g.gameId = bkw.gameId
    LEFT JOIN (
      SELECT notifyId, chatLink from notifications
    ) ntf ON g.notifyId = ntf.notifyId    
    WHERE g.gameId = ${gameId}`
  );
  if (games.length !== 1) {
    throw new Error(`getGame(): cannot find game with gameId:${gameId}`);
  }

  const game = games[0];
  const place = await getPlace(game.placeId);
  const organizer = await dal.user.getUser(game.organizerId);

  return new Game({
    ...game,
    place,
    organizer,
  });
};

const getGameOrganizerId = async (gameId) => {
  const games = await execSQL.all(`SELECT organizerId FROM games g
    WHERE g.gameId = ${gameId}`
  );
  if (games.length !== 1) {
    throw new Error(`getGame(): cannot find game with gameId:${gameId}`);
  }

  return games[0].organizerId;
};

const getGameDetails = async (gameId) => {
  const game = await getGame(gameId);
  const allBookings = await execSQL.all(`SELECT * FROM bookings
    WHERE gameId = ${game.gameId}`
  );
  const players = allBookings.filter(b => ['reserved', 'booked'].indexOf(b.status) > -1);
  const waiters = allBookings.filter(b => b.status == 'waiting');

  return new GameDetails(
    game,
    players.map(pl => new Reservation(pl)),
    waiters.map(wt => new Reservation(wt)),
  );
};

const getPlaces = async (placeIds) => {
  const places = await execSQL.all(`SELECT * FROM places
    WHERE placeId IN (${placeIds.join()})`);
  return places.map(p => new Place(p));
};

const getPlace = async (placeId) => {
  const place = await execSQL.all(`SELECT * FROM places
    WHERE placeId = ${placeId}`);
  return new Place(place[0]);
};

const getGamesList = async (props = {}) => {
  const today = utils.getStartOfTheDate();
  if (props.showLastMonth) {
    today.setHours(-24*30);
  }

  let games = await execSQL.all(`SELECT g.*, usedPlayerSlots, usedWaiterSlots FROM games g
    LEFT JOIN (
      SELECT gameId, count(*) usedPlayerSlots from bookings
      WHERE status IN ('booked', 'reserved')
      GROUP BY gameId
    ) bk ON g.gameId = bk.gameId
    LEFT JOIN (
      SELECT gameId, count(*) usedWaiterSlots from bookings
      WHERE status = 'waiting'
      GROUP BY gameId
    ) bkw ON g.gameId = bkw.gameId
    WHERE date >= "${today.toJSON().slice(0,10)}"
    ORDER BY date ASC`);

  const organizerIds = Object.keys(games.reduce((acc, val) => {
    acc[val.organizerId] = true;
    return acc;
  }, {}));

  const placeIds = Object.keys(games.reduce((acc, val) => {
    acc[val.placeId] = true;
    return acc;
  }, {}));

  const places = await getPlaces(placeIds);
  const organizers = await dal.user.getUsers(organizerIds);

  if (!props.showDisabled) {
    games = games.filter(g => g.status !== 'disabled');
  }

  return games.map(game => new Game({
    ...game,
    place: places.filter(p => p.placeId === game.placeId).pop(),
    organizer: organizers.filter(o => o.userId == game.organizerId).pop(),
  }));
};

const moveWaiters = async (gameId, ttl) => {
  const bookIds = await execSQL.all(`SELECT bookId from bookings
    WHERE status = 'waiting'
    AND gameId = ${gameId}
    ORDER by ts 
    LIMIT 1`);

  if (bookIds.length > 0) {
    const bookId = bookIds[0].bookId;
    const ttlDB = (ttl > 0) ? (Date.now() + ttl) : 0;
    const res = await execSQL.run(`UPDATE bookings SET status = 'reserved', expireAt = ${ttlDB}
      WHERE bookId = ${bookId} AND 
      (SELECT count(*) from bookings WHERE status IN ('booked', 'reserved') AND gameId = ${gameId}) <
      (SELECT bookingSlots from games WHERE gameId = ${gameId})`);

    if (res && res.changes == 1) {
      return bookId;
    }
  }
}; 


module.exports = {
  init: (driver, dalInstance) => {
    if (!driver) { throw new Error(`${__filename}: undefined DAL driver`); }

    execSQL = driver.methods;
    log = driver.dalLog;
    dal = dalInstance;

    return {
      getGamesList,
      getGame,
      getGameDetails,
      getGameOrganizerId,
      moveWaiters,
    };
  }
};

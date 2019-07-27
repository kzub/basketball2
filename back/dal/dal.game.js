const utils = require('../utils/misc');
const { Game, GameDetails, Reservation } = require('./types');

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
  const place = await dal.place.getPlace(game.placeId);
  const organizer = await dal.user.getUser(game.organizerId);

  return new Game({
    ...game,
    place,
    organizer,
  });
};

const addGame = async (game) => {
  const res = await execSQL.run(`INSERT INTO games
    (placeId, notifyId, date, timeStart, timeEnd, organizerId, playerSlots, waiterSlots, status,
    paymentType, paymentAmount, paymentMessage, paymentGateAccount, paymentGateMessage)
    VALUES (${game.place.placeId}, ${game.notifyId}, '${game.date}', '${game.timeStart}',
    '${game.timeEnd}', ${game.organizer.userId}, ${game.playerSlots}, ${game.waiterSlots},
    '${game.status}', '${game.paymentType}', ${game.paymentAmount}, '${game.paymentMessage}',
    '${game.paymentGateAccount}', '${game.paymentGateMessage}')
  `);

  return res && res.lastID;
};

const updateGame = async (game) => {
  let sql = `UPDATE games
    SET `;

  if (game.playerSlots) { sql += `playerSlots = ${game.playerSlots}, \n`; }
  if (game.waiterSlots) { sql += `waiterSlots = ${game.waiterSlots}, \n`; }
  if (game.paymentAmount !== null) { sql += `paymentAmount = ${game.paymentAmount}, \n`; }
  if (game.paymentMessage !== null) { sql += `paymentMessage = ${game.paymentMessage}, \n`; }
  if (game.status) { sql += `status = '${game.status}' \n`; }

  sql += `WHERE gameId = ${game.gameId}`;

  const res = await execSQL.run(sql);
  return res && res.lastID;
};


const getGameOrganizerId = async (gameId) => {
  const games = await execSQL.all(`SELECT organizerId FROM games
    WHERE games.gameId = ${gameId}`
  );
  if (games.length !== 1) {
    throw new Error(`getGameOrganizerId(): cannot find game with gameId:${gameId}`);
  }

  return games[0].organizerId;
};

const getGameNotifyId = async (gameId) => {
  const games = await execSQL.all(`SELECT notifyId FROM games
    WHERE games.gameId = ${gameId}`
  );
  if (games.length !== 1) {
    throw new Error(`getGameNotifyId(): cannot find game with gameId:${gameId}`);
  }

  return games[0].notifyId;
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

const getGamesList = async (props = {}) => {
  const today = utils.getStartOfTheDate();
  if (props.showLastMonth) {
    today.setHours(-24*30);
  }

  let games = await execSQL.all(`SELECT g.*, usedPlayerSlots, usedWaiterSlots, chatLink FROM games g
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
    LEFT JOIN (
      SELECT notifyId, chatLink from notifications
    ) ntf ON g.notifyId = ntf.notifyId
    WHERE date >= "${today.toJSON().slice(0,10)}"
    ORDER BY date,timeStart ASC`);

  const organizerIds = Object.keys(games.reduce((acc, val) => {
    acc[val.organizerId] = true;
    return acc;
  }, {}));

  const placeIds = Object.keys(games.reduce((acc, val) => {
    acc[val.placeId] = true;
    return acc;
  }, {}));

  const places = await dal.place.getPlaces(placeIds);
  const organizers = await dal.user.getUsers(organizerIds);

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
      (SELECT playerSlots from games WHERE gameId = ${gameId})`);

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
      addGame,
      getGame,
      getGameDetails,
      getGameNotifyId,
      getGameOrganizerId,
      getGamesList,
      moveWaiters,
      updateGame,
    };
  }
};

const { Reservation } = require('./types');

let log; // eslint-disable-line
let dal; // eslint-disable-line
let execSQL;

const create = async (gameId, slotType, ttl, user) => {
  const status = slotType === 'player' ? 'reserved' : 'waiting';
  const res = await execSQL.run(`INSERT INTO bookings 
    (ts, gameId, userId, playerName, paymentAmount, paymentStatus, status, expireAt) VALUES 
    (${Date.now()}, ${gameId}, ${user.userId}, '${user.name}', 0, 'unpaid', '${status}', ${ttl})`);

  return res && res.lastID;
};

const get = async (gameId, bookId) => {
  const res = await execSQL.all(`SELECT * FROM bookings 
    WHERE gameId = ${gameId} AND bookId = ${bookId}`);

  return new Reservation(res[0]);
};

const update = async (reservation) => {
  const res = await execSQL.run(`UPDATE bookings SET
    playerName = '${reservation.playerName}',
    paymentAmount = ${reservation.paymentAmount},
    paymentStatus = '${reservation.paymentStatus}',
    paymentId = ${reservation.paymentId},
    status = '${reservation.status}',
    expireAt = '${reservation.expireAt}'
    WHERE gameId = ${reservation.gameId}
    AND bookId = ${reservation.bookId}`);
  return res && res.changes == 1;
};

const getExpired = async () => {
  const expired = await execSQL.all(`SELECT * FROM bookings 
    WHERE expireAt > 0 
    AND expireAt < ${Date.now()}
    AND status = 'reserved'`);

  return expired.map(r => new Reservation(r));
};

module.exports = {
  init: (driver, dalInstance) => {
    if (!driver) { throw new Error(`${__filename}: undefined DAL driver`); }

    execSQL = driver.methods;
    log = driver.dalLog;
    dal = dalInstance;

    return {
      create,
      get,
      getExpired,
      update,
    };
  }
};

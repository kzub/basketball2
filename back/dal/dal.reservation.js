const { User, Reservation } = require('./types');

let log;
let execSQL;

const create = async (gameId, slotType, user) => {
  const status = slotType === 'player' ? 'reserved' : 'waiting';
  const res = await execSQL.run(`INSERT INTO bookings 
    (ts, gameId, userId, playerName, paymentAmount, paymentStatus, status) VALUES 
    (${Date.now()}, ${gameId}, ${user.userId}, '${user.name}', 0, 'unpaid', '${status}')`);

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
    status = '${reservation.status}'
    WHERE gameId = ${reservation.gameId}
    AND bookId = ${reservation.bookId}`);
  return res && res.changes == 1;
}

module.exports = {
  init: (driver, dalInstance) => {
    if (!driver) { throw `${__filename}: undefined DAL driver`; }

    execSQL = driver.methods;
    log = driver.dalLog;

    return {
      create,
      update,
      get,
    };
  }
};

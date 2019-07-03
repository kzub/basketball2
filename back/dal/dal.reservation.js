const { User } = require('./types');

let log;
let execSQL;

const create = async (gameId, slotType, user) => {
  const status = slotType === 'player' ? 'reserved' : 'waiting';
  const res = await execSQL.run(`INSERT INTO bookings 
    (ts, gameId, userId, playerName, paymentAmount, paymentStatus, status) VALUES 
    (${Date.now()}, ${gameId}, ${user.userId}, '${user.name}', 0, 'unpaid', '${status}')`);

  return res && res.lastID;
};

module.exports = {
  init: (driver, dalInstance) => {
    if (!driver) { throw `${__filename}: undefined DAL driver`; }

    execSQL = driver.methods;
    log = driver.dalLog;

    return {
      create,
    };
  }
};

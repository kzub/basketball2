const { Transfer } = require('./types');

let log; // eslint-disable-line
let dal; // eslint-disable-line
let execSQL;

const randomCodeGenerator = (length) => {
  const letters = [];
  for (let i = 0; i < length; i++) {
    const l = 0x41 + Math.floor(Math.random() * 25);
    letters.push(String.fromCharCode(l));
  }
  return letters.join('');
};

const create = async (gameId, bookId, userId) => {
  const check = await execSQL.all(`SELECT * FROM transfers WHERE
    gameId = ${gameId} AND
    bookId = ${bookId} AND
    playerId = ${userId} AND
    executedAt is NULL`);

  if (check[0]) { // do not allow multiple active transfers at same time
    return check[0].transferCode;
  }

  const transferCode = randomCodeGenerator(16);
  const res = await execSQL.run(`INSERT INTO transfers
    (transferCode, created, gameId, bookId, playerId) VALUES
    ('${transferCode}', '${(new Date()).toJSON()}', ${gameId}, ${bookId}, ${userId})`);

  return res && res.lastID && transferCode;
};

const get = async (transferCode) => {
  const res = await execSQL.all(`SELECT * FROM transfers
    WHERE transferCode = '${transferCode}' AND executedAt is NULL`);

  return res[0] && new Transfer(res[0]);
};

const finish = async (transfer) => {
  const res = await execSQL.run(`UPDATE transfers
    SET
      newPlayerId = ${transfer.newPlayerId},
      executedAt = '${(new Date()).toJSON()}'
    WHERE
      gameId = ${transfer.gameId} AND
      bookId = ${transfer.bookId} AND
      playerId = ${transfer.playerId} AND
      transferCode = '${transfer.transferCode}' AND
      executedAt is NULL
  `);
  return res && res.changes == 1;
};

module.exports = {
  init: (driver, dalInstance) => {
    if (!driver) { throw new Error(`${__filename}: undefined DAL driver`); }

    execSQL = driver.methods;
    log = driver.dalLog;
    dal = dalInstance;

    return {
      create,
      finish,
      get,
    };
  }
};

let log; // eslint-disable-line
let dal; // eslint-disable-line
let execSQL;

const addTransaction = async (recipientId, paySystem, amount, rawData) => {
  const res = await execSQL.run(`INSERT INTO 
    payments (ts, recipientId, paySystem, amount, rawData)
    VALUES (${Date.now()}, ${recipientId}, '${paySystem}', ${amount}, '${JSON.stringify(rawData)}')`);
  
  return res && res.lastID;
};

module.exports = {
  init: (driver, dalInstance) => {
    if (!driver) { throw new Error(`${__filename}: undefined DAL driver`); }

    execSQL = driver.methods;
    log = driver.dalLog;
    dal = dalInstance;

    return {
      addTransaction,
    };
  }
};

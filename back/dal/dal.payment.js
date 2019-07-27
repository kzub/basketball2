let log; // eslint-disable-line
let dal; // eslint-disable-line
let execSQL;

const addTransaction = async (recipientId, paySystem, amount, rawData) => {
  const res = await execSQL.run(`INSERT INTO 
    payments (ts, recipientId, paySystem, amount, rawData)
    VALUES (${Date.now()}, ${recipientId}, '${paySystem}', ${amount}, '${JSON.stringify(rawData)}')`);
  
  return res && res.lastID;
};

const findOrganizerIdByPaySystem = async (paySystem) => {
  const organizers = await execSQL.all(`SELECT organizerId FROM organizers
    WHERE paySystem = '${paySystem}'`);

  return organizers[0] && organizers[0].organizerId;
};

const findOrganizerByPaySystem = async (paySystem) => {
  const organizerId = await findOrganizerIdByPaySystem(paySystem);
  if (organizerId) {
    const user = dal.user.getUser(organizerId);
    return user;
  }
};

module.exports = {
  init: (driver, dalInstance) => {
    if (!driver) { throw new Error(`${__filename}: undefined DAL driver`); }

    execSQL = driver.methods;
    log = driver.dalLog;
    dal = dalInstance;

    return {
      addTransaction,
      findOrganizerByPaySystem,
      findOrganizerIdByPaySystem,
    };
  }
};

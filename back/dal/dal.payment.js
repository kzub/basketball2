let log; // eslint-disable-line
let dal; // eslint-disable-line
let execSQL;
let maybeText;

const addTransaction = async (recipientId, paySystem, amount, gameId, bookId, userId, rawData) => {
  const res = await execSQL.run(`INSERT INTO
    payments (ts, recipientId, paySystem, amount, gameId, bookId, userId, rawData)
    VALUES (${Date.now()}, ${recipientId}, '${paySystem}', ${amount}, ${gameId}, ${bookId}, ${userId}, '${JSON.stringify(rawData)}')`);

  return res && res.lastID;
};

const findOrganizerIdByPaySystem = async (paySystem) => {
  const organizers = await execSQL.all(`SELECT organizerId FROM organizersYM
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

const getPrepayMethodsByOrganizerId = async (organizerId) => {
  const prepays = await execSQL.all(`SELECT paymentGateAccount, paymentGateMessage
    FROM organizersYM WHERE organizerId = '${organizerId}'`);

  return prepays;
};

const getPaymentReciever = async (organizerId) => {
  const data = await execSQL.all(`SELECT userId, name, paymentGateAccount, paymentGateMessage
    FROM organizersYM
    LEFT JOIN users ON organizersYM.organizerId = users.userId
    WHERE organizersYM.organizerId = ${organizerId}`);

  return data;
};

const getPayment = async (paymentId) => {
  const data = await execSQL.all(`SELECT *
    FROM payments
    WHERE paymentId = ${paymentId}`);

  return data.pop();
};

const getCreditors = async (organizerId) => {
  //transactionId,date,userId,organizerId,amount,sourceType,sourceId,comment
  const data = await execSQL.all(`SELECT userId, SUM(amount) amount
    FROM credits
    WHERE organizerId = ${organizerId}
    GROUP BY userId`);

  return data;
};

const addCreditTransaction = async (userId, organizerId, amount, sourceType, sourceId = null, comment = null) => {
  const res = await execSQL.run(`INSERT INTO
    credits (date, userId, organizerId, amount, sourceType, sourceId, comment)
    VALUES ('${new Date().toJSON()}', ${userId}, ${organizerId}, ${amount}, '${sourceType}', ${sourceId}, ${maybeText(comment)})`);

  return res && res.lastID;
};

module.exports = {
  init: (driver, dalInstance) => {
    if (!driver) { throw new Error(`${__filename}: undefined DAL driver`); }

    dal = dalInstance;
    execSQL = driver.methods;
    log = driver.dalLog;
    maybeText = driver.utils.maybeText;

    return {
      addCreditTransaction,
      addTransaction,
      findOrganizerByPaySystem,
      findOrganizerIdByPaySystem,
      getCreditors,
      getPayment,
      getPaymentReciever,
      getPrepayMethodsByOrganizerId,
    };
  }
};

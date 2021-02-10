let log; // eslint-disable-line
let dal; // eslint-disable-line
let execSQL;
let maybeText;
const MIN_PAYMENT_AMOUNT = 2;

const addTransaction = async (recipientId, paySystem, amount, gameId, bookId, userId, rawData = {}) => {
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
  const prepays = await execSQL.all(`SELECT paymentGateAccount, paymentGateMessage, hoursBeforeGameRefundAllowed
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
  const data = await execSQL.all(`SELECT userId, SUM(amount) total
    FROM credits
    WHERE organizerId = ${organizerId}
    GROUP BY userId
    HAVING total > 0`);

  return data;
};

const addCreditTransaction = async (userId, organizerId, amount, sourceType, sourceId = null, comment = null) => {
  const res = await execSQL.run(`INSERT INTO
    credits (date, userId, organizerId, amount, sourceType, sourceId, comment)
    VALUES ('${new Date().toJSON()}', ${userId}, ${organizerId}, ${amount}, '${sourceType}', ${sourceId}, ${maybeText(comment)})`);

  return res && res.lastID;
};

const getUserCredits = async (userId) => {
  //transactionId,date,userId,organizerId,amount,sourceType,sourceId,comment
  const data = await execSQL.all(`SELECT u.name name, organizerId, SUM(amount) total
    FROM credits
    LEFT JOIN (
      SELECT * FROM users
    ) u ON u.userId = credits.organizerId
    WHERE credits.userId = ${userId}
    GROUP BY organizerId
    HAVING total > 0`);

  return data;
};

const getUserCreditsForOrganizerId = async (userId, organizerId) => {
  //transactionId,date,userId,organizerId,amount,sourceType,sourceId,comment
  const data = await execSQL.all(`SELECT u.name name, organizerId, SUM(amount) total
    FROM credits
    LEFT JOIN (
      SELECT * FROM users
    ) u ON u.userId = credits.organizerId
    WHERE credits.userId = ${userId}
    AND credits.organizerId = ${organizerId}
    GROUP BY organizerId
    HAVING total > 0`);

  return data.pop();
};

const getUserWithCreditsNotifyIds = async (userId, organizerId) => {
  //transactionId,date,userId,organizerId,amount,sourceType,sourceId,comment
  const data = await execSQL.all(`SELECT c.userId, group_concat(g2.notifyId) ids
    FROM credits c
    LEFT JOIN bookings b2 ON c.sourceId = b2.bookId
    LEFT JOIN games g2 ON g2.gameId  = b2.gameId
    WHERE c.userId = ${userId}
    AND c.organizerId = ${organizerId}
    AND c.sourceType = "reservation.cancel"
    GROUP BY c.userId`
  );

  return data.pop();
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
      getUserCredits,
      getUserCreditsForOrganizerId,
      getUserWithCreditsNotifyIds,
      MIN_PAYMENT_AMOUNT,
    };
  }
};

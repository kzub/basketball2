const { User, OrganizerSettings } = require('./types');

let log; // eslint-disable-line
let dal; // eslint-disable-line
let execSQL;

const getUsers = async (usersIds) => {
  const users = await execSQL.all(`SELECT * FROM users
    WHERE userId IN (${usersIds.join()})`);
  return users.map(u => new User(u));
};

const getUser = async (userId) => {
  const users = await execSQL.all(`SELECT * FROM users
    LEFT JOIN (
      SELECT organizerId, 1 isOrganizer FROM organizersPlaces
      WHERE organizerId = ${userId}
    ) Places ON users.userId = Places.organizerId
    LEFT JOIN (
      SELECT organizerId, 1 hasYM FROM organizersYM
      WHERE organizerId = ${userId}
    ) YMs ON users.userId = YMs.organizerId
    WHERE userId = ${userId}`);
  return new User(users[0]);
};

const updateUser = async (userId, name) => {
  const res = await execSQL.run(`UPDATE users SET name = '${name}'
    WHERE userId = ${userId}`);
  return res && res.changes == 1;
};

const createUserByPhone = async (phone) => {
  const res = await execSQL.run(`INSERT INTO users (name, phone)
    VALUES ('', ${phone})`);
  if (res && res.lastID) {
    return new User({
      userId: res.lastID,
      phone: phone,
      name: '',
    });
  }
};

const findUserByPhone = async (phone) => {
  const res = await execSQL.all(`SELECT * FROM users
    WHERE phone = ${phone}`);
  const user = res[0];
  return user && new User(user);
};

const getVerificationCode = async (phone) => {
  const code = await execSQL.all(`SELECT * FROM verifications
    WHERE phone = "${phone}"
    AND ttl > ${Date.now()}`
  );
  return code[0];
};

const deleteVerificationCode = async (phone) =>
  execSQL.run(`DELETE FROM verifications
    WHERE phone = ${phone} OR ttl < ${Date.now()}`);


const createVerificationCode = async (phone) => {
  const code = 1000 + Math.floor(Math.random() * 8999);
  const ttl = Date.now() + 10*60*1000;

  await deleteVerificationCode(phone);
  await execSQL.run(`INSERT INTO verifications (phone, code, ttl)
    VALUES (${phone}, ${code}, ${ttl})`);
  return code;
};


const findOrganizerByUserId = async (userId) => {
  const places = await execSQL.all(`SELECT * FROM organizersPlaces
    WHERE organizerId = ${userId}`);

  const yandexMoneys = await execSQL.all(`SELECT * FROM organizersYM
    WHERE organizerId = ${userId}`);

  return new OrganizerSettings(userId, places, yandexMoneys);
};

module.exports = {
  init: (driver, dalInstance) => {
    if (!driver) { throw new Error(`${__filename}: undefined DAL driver`); }

    execSQL = driver.methods;
    log = driver.dalLog;
    dal = dalInstance;

    return {
      createUserByPhone,
      createVerificationCode,
      deleteVerificationCode,
      findOrganizerByUserId,
      findUserByPhone,
      getUser,
      getUsers,
      getVerificationCode,
      updateUser,
    };
  }
};

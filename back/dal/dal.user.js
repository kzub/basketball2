const { User } = require('./types');

let log;
let execSQL;

const getUsers = async (usersIds) => {
  const users = await execSQL.all(`SELECT * FROM users
    WHERE userId IN (${usersIds.join()})`);
  return users.map(u => new User(u));
};

const getUser = async (userId) => {
  const users = await execSQL.all(`SELECT * FROM users
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
    VALUES ('new', ${phone})`);
  if (res && res.lastID) {
    return new User({
      userId: res.lastID,
      phone: phone,
      name: 'new',
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

module.exports = {
  init: (driver, dalInstance) => {
    if (!driver) { throw new Error(`${__filename}: undefined DAL driver`); }

    execSQL = driver.methods;
    log = driver.dalLog;

    return {
      getUser,
      getUsers,
      getVerificationCode,
      deleteVerificationCode,
      createVerificationCode,
      createUserByPhone,
      findUserByPhone,
      updateUser,
    };
  }
};

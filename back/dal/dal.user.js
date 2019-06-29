const { User } = require('./types');

let log;
let execSQL;

const getUsers = async (usersIds) => {
  const users = await execSQL.all(`SELECT * FROM users
    WHERE userId IN (${usersIds.join()})`);
  return users.map(u => new User(u));
};

module.exports = {
  init: (driver) => {
    if (!driver) { throw `${__filename}: undefined DAL driver`; }

    execSQL = driver.methods;
    log = driver.dalLog;

    return {
      getUsers,
    };
  }
};

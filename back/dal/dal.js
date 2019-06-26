const utils = require('../utils/misc');
const config = utils.getConfig();
const logger = require('../utils/logger');
let sqlite3 = require('sqlite3').verbose();

const log = logger.create('DAL');

let db = new sqlite3.Database(config.sqlite.filename);
log.info(`use config.sqlite.filename: ${config.sqlite.filename}`);

db.serialize();
db.run(`CREATE TABLE IF NOT EXISTS bookings (
  ts INTEGER DEFAULT CURRENT_TIMESTAMP NOT NULL,
  bookId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  gameId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  playerName TEXT NOT NULL,
  paymentAmount INT,
  paymentStatus TEXT NOT NULL,
  status TEXT NOT NULL
)`);

db.run(`CREATE TABLE IF NOT EXISTS places (
  placeId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  position TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS users (
  userId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL
)`);

db.run(`CREATE TABLE IF NOT EXISTS games (
  gameId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  placeId INTEGER NOT NULL,
  date DATETIME NOT NULL,
  timeStart TEXT NOT NULL,
  timeEnd TEXT NOT NULL,
  organizerId INTEGER NOT NULL,
  playerSlots INTEGER NOT NULL,
  waiterSlots INTEGER NOT NULL,
  status TEXT NOT NULL,
  paymentType TEXT NOT NULL,
  paymentAmount INTEGER NOT NULL,
  props TEXT NOT NULL DEFAULT '{}'
)`);

const promiseSQL = (dalLog, cmd, query, ...rest) => {
  dalLog.info(query);
  return new Promise(function (fulfill, reject){
    db[cmd](query, ...rest, function (err, res){
      // dalLog.info(`FIN: ${err} ${JSON.stringify(res, null, 2)} ${this}`);
      if (err) reject(err);
      else fulfill({
        statement: this,
        result: res,
      });
    });
  });
};

const execSQL = (name) => {
  const dalLog = logger.create(name);
  return {
    methods: {
      all: async (...rest) => (await promiseSQL(dalLog, 'all', ...rest)).result,
      run: async (...rest) => (await promiseSQL(dalLog, 'run', ...rest)).statement,      
    },
    dalLog,
  };
};

module.exports = {
  games: require('./dal.games').init(execSQL('DAL_GAMES')),
};

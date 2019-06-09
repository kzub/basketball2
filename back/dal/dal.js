const utils = require('../utils/misc');
const config = utils.getConfig();
const logger = require('../utils/logger');
let sqlite3 = require('sqlite3').verbose();

const log = logger.create('DAL');

let db = new sqlite3.Database(config.sqlite.filename);
log.info(`use config.sqlite.filename: ${config.sqlite.filename}`);

db.serialize();
db.run(`CREATE TABLE IF NOT EXISTS bookings (
  bookId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  gameId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  playerName TEXT NOT NULL,
  paymentAmount INT,
  paymentStatus TEXT NOT NULL,
  status TEXT NOT NULL
)`);

db.run(`CREATE TABLE IF NOT EXISTS games (
  gameId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
  placeId INTEGER NOT NULL,
  time TEXT NOT NULL,
  date DATETIME NOT NULL,
  organizerId INTEGER NOT NULL,
  bookingSlots INTEGER NOT NULL,
  reservingSlots INTEGER NOT NULL,
  status TEXT NOT NULL,
  paymentType TEXT NOT NULL,
  paymentAmount INTEGER NOT NULL,
  props TEXT NOT NULL DEFAULT '{}'
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

const promiseSQL = (dalLog, cmd, query, ...rest) => {
  dalLog.info(query);
  return new Promise(function (fulfill, reject){
    db[cmd](query, ...rest, function (err, res){
      // log.info(`FIN: ${err} ${res} ${this}`);
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
  games: require('./games').init(execSQL('DAL_GAMES')),
};

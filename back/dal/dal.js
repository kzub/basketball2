const utils = require('../utils/misc');
const config = utils.getConfig();
const logger = require('../utils/logger');
let sqlite3 = require('sqlite3').verbose();

const log = logger.create('DAL');

let db = new sqlite3.Database(config.sqlite.filename);
log.info(`use config.sqlite.filename: ${config.sqlite.filename}`);

db.serialize();
db.run(`CREATE TABLE IF NOT EXISTS bookings (
  ts INTEGER NOT NULL,
  bookId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  gameId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  playerName TEXT NOT NULL,
  paymentAmount INT,
  paymentStatus TEXT NOT NULL,
  paymentId INT,
  status TEXT NOT NULL
)`);

db.run(`CREATE TABLE IF NOT EXISTS payments (
  ts INTEGER NOT NULL,
  paymentId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  recipientId INTEGER NOT NULL DEFAULT 0,
  paySystem TEXT NOT NULL,
  amount INT,
  rawData TEXT NOT NULL DEFAULT '{}'
)`);

db.run(`CREATE TABLE IF NOT EXISTS places (
  placeId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  chatLink TEXT,
  position TEXT,
  howToGet TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS users (
  userId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL
)`);

db.run(`CREATE TABLE IF NOT EXISTS verifications (
  phone TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL,
  ttl INTEGER NOT NULL
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
  paymentInfo TEXT NOT NULL DEFAULT '{}',
  props TEXT NOT NULL DEFAULT '{}'
)`);

const promiseSQL = (dalLog, cmd, query, ...rest) => {
  dalLog.debug(query);
  return new Promise(function (fulfill, reject){
    db[cmd](query, ...rest, function (err, res){
      dalLog.debug(`FIN: ${err} ${JSON.stringify(res, null, 2)} ${this}`);
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

const dalInstance = {};
dalInstance.game = require('./dal.game').init(execSQL('DAL_GAME'), dalInstance);
dalInstance.user = require('./dal.user').init(execSQL('DAL_USER'), dalInstance);
dalInstance.reservation = require('./dal.reservation').init(execSQL('DAL_RSV'), dalInstance);
dalInstance.payment = require('./dal.payment').init(execSQL('DAL_PAYMENT'), dalInstance);

module.exports = dalInstance;

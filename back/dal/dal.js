const utils = require('../utils/misc');
const config = utils.getConfig();
const logger = require('../utils/logger');
let sqlite3 = require('sqlite3').verbose();

const log = logger.create('DAL');

let db = new sqlite3.Database(config.sqlite.filename);
log.info(`use DB filename: ${config.sqlite.filename}`);

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
  status TEXT NOT NULL,
  expireAt INTEGER
)`);

db.run(`CREATE TABLE IF NOT EXISTS payments (
  ts INTEGER,
  paymentId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  recipientId INTEGER,
  paySystem TEXT,
  amount INTEGER,
  gameId INTEGER,
  bookId INTEGER,
  userId INTEGER,
  rawData TEXT NOT NULL DEFAULT '{}'
)`);

db.run(`CREATE TABLE IF NOT EXISTS credits (
  transactionId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  date DATETIME NOT NULL,
  userId INTEGER NOT NULL,
  organizerId INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  sourceType TEXT NOT NULL,
  sourceId INTEGER,
  comment TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS organizersPlaces (
  organizerId INTEGER NOT NULL,
  placeId INTEGER NOT NULL
)`);

db.run(`CREATE TABLE IF NOT EXISTS organizersNotifications (
  organizerId INTEGER NOT NULL,
  notifyId INTEGER NOT NULL
)`);

db.run(`CREATE TABLE IF NOT EXISTS organizersYM (
  organizerId INTEGER NOT NULL,
  paySystem TEXT NOT NULL,
  paymentGateAccount TEXT NOT NULL,
  paymentGateMessage TEXT NOT NULL
)`);

db.run(`CREATE TABLE IF NOT EXISTS places (
  placeId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  lat INTEGER,
  lng INTEGER,
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

db.run(`CREATE TABLE IF NOT EXISTS notifications (
  notifyId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  label TEXT NOT NULL,
  chatLink TEXT,
  userEvents TEXT,
  userChatId TEXT NOT NULL,
  adminChatId TEXT NOT NULL,
  botToken TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS games (
  gameId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  placeId INTEGER NOT NULL,
  notifyId INTEGER NOT NULL,
  date DATETIME NOT NULL,
  timeStart TEXT NOT NULL,
  timeEnd TEXT NOT NULL,
  organizerId INTEGER NOT NULL,
  playerSlots INTEGER NOT NULL,
  waiterSlots INTEGER NOT NULL,
  status TEXT NOT NULL,
  paymentType TEXT NOT NULL,
  paymentAmount INTEGER NOT NULL,
  paymentMessage TEXT,
  paymentGateAccount TEXT,
  paymentGateMessage TEXT
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

const maybeText = (text) => {
  if (text === null) {
    return null;
  }
  return `'${text}'`;
};

const execSQL = (name) => {
  const dalLog = logger.create(name);
  return {
    methods: {
      all: async (...rest) => (await promiseSQL(dalLog, 'all', ...rest)).result,
      run: async (...rest) => (await promiseSQL(dalLog, 'run', ...rest)).statement,
    },
    utils: {
      maybeText,
    },
    dalLog,
  };
};

const dalInstance = {};
dalInstance.game = require('./dal.game').init(execSQL('DAL_GAME'), dalInstance);
dalInstance.place = require('./dal.place').init(execSQL('DAL_PLACE'), dalInstance);
dalInstance.user = require('./dal.user').init(execSQL('DAL_USER'), dalInstance);
dalInstance.reservation = require('./dal.reservation').init(execSQL('DAL_RSV'), dalInstance);
dalInstance.payment = require('./dal.payment').init(execSQL('DAL_PAYMENT'), dalInstance);
dalInstance.notification = require('./dal.notification').init(execSQL('DAL_NOTIFICATION'), dalInstance);

module.exports = dalInstance;

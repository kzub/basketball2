const utils = require('./misc');
const winston = require('winston');
const { format } = require('logform');

require('winston-daily-rotate-file');

const config = utils.getConfig();

const consoleFormat = (name, req) => format.combine(
  format.colorize(),
  format.timestamp(),
  format.printf(info => {
    let msg = info.message; // some shit happens if log object contain message object =(. have no time to understand it
    if (typeof msg === 'object') {
      msg = JSON.stringify(msg, undefined, 2);
    }
    if (req) {
      return `${info.timestamp} RQ ${req.id} [${info.level}]: ${msg}`;
    }
    return `${info.timestamp} INT ${name} [${info.level}]: ${msg}`;
  })
);

const jsonFormat = (name, req) => format.combine(
  format.timestamp(),
  format.printf(info => {
    let msg = info.message;
    if (typeof msg === 'object') {
      msg = JSON.stringify(msg, undefined, 2);
    }
    return JSON.stringify({
      reqId: req && req.id,
      userId: req && req.userId,
      name: name,
      ...info,
      message: msg,
    });
  }),
);

let logTransport = new winston.transports.Console();
if (config.logger.logdir && process.env.DOCKER_LOGS !== 'true') {
  logTransport = new (winston.transports.DailyRotateFile)({
    filename: `${config.logger.logdir}basketmsk-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
  });
}

const create = (name, req) => {
  let format;

  if (config.logger.logfile && process.env.DOCKER_LOGS !== 'true') {
    format = jsonFormat(name, req);
  } else {
    format = consoleFormat(name, req);
  }

  const logger = winston.createLogger({
    level: config.logger.loglevel || 'info',
    format,
    transports : [logTransport],
    exitOnError: false,
  });

  const publicLogger = {};
  for (let level in logger.levels) {
    publicLogger[level] = (...rest) => {
      return logger[level](...rest);
    };
  }
  return publicLogger;
};

module.exports = { create };
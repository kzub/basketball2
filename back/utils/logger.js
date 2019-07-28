const winston = require('winston');
const { format } = require('logform');
const utils = require('./misc');

const config = utils.getConfig();

const consoleFormat = (name, req) => format.combine(
  format.colorize(),
  format.timestamp(),
  format.printf(info => {
    if (typeof info.message === 'object') {
      info.message = JSON.stringify(info.message, undefined, 2);
    }
    if (req) {
      return `${info.timestamp} RQ ${req.id} [${info.level}]: ${info.message}`;
    }
    return `${info.timestamp} INT ${name} [${info.level}]: ${info.message}`;
  })
);

const jsonFormat = (name, req) => format.combine(
  format.timestamp(),
  format.printf(info => {
    if (typeof info.message === 'object') {
      info.data = JSON.stringify(info.message, undefined, 2);
      delete info.message;
    }
    return JSON.stringify({
      reqId: req && req.id,
      userId: req && req.userId,
      name: name,
      ...info,
    });
  }),
);

const create = (name, req) => {
  let format;
  let transport;

  if (config.logger.logfile) {
    format = jsonFormat(name, req);
    transport = new winston.transports.File({ filename: config.logger.logfile });
  } else {
    format = consoleFormat(name, req);
    transport = new winston.transports.Console();
  }

  const logger = winston.createLogger({
    level: config.logger.loglevel || 'info',
    format,
    transports : [transport],
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
const winston = require('winston');
const { format } = require('logform');

const dev = true;

const consoleFormat = (name, req) => format.combine(
  format.colorize(),
  format.timestamp(),
  format.printf(info => {
    if (typeof info.message === 'object') {
      info.message = JSON.stringify(info.message, undefined, 2);
    }
    if (req) {
      return `${info.timestamp} [${req.ip}] ${req.userId} [${info.level}]: ${info.message}`;
    }
    return `${info.timestamp} ${name} [${info.level}]: ${info.message}`;
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
      userId: req && req.userId,
      name: name,
      ...info,
    });
  }),
);

const createLogger = (logFormat, transports) => {
  return {
    level: 'info',
    format: logFormat,
    transports,
    exitOnError: false,
  };
};

const create = (name, req) => {
  let logger;
  if (dev) {
    logger = winston.createLogger(createLogger(
      consoleFormat(name, req), new winston.transports.Console()));
  } else {
    logger = winston.createLogger(createLogger(
      jsonFormat(name, req), new winston.transports.File({ filename: 'basket2.log' })));
  }

  const publicLogger = {};
  for (let level in logger.levels) {
    publicLogger[level] = (...rest) => {
      return logger[level](...rest);
    }
  }
  return publicLogger;
};

module.exports = { create };
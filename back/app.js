const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const uuid = require('uuid');

const apiRoutes = require('./api/routes');
const auth = require('./utils/auth');
const dal = require('./dal/dal');
const events = require('./utils/notifications');
const logger = require('./utils/logger');
const utils = require('./utils/misc');

const app = express();
const log = logger.create('APP');

process.on('unhandledRejection', function(reason){
  log.error(`unhandledRejection at promise with reason: ${reason && reason.stack ? reason.stack : reason}`);
  events.emit('system.unhandledRejection');
});

process.on('uncaughtException', function(error) {
  log.error(`uncaughtException: ${error && error.stack ? error.stack : error}`);
  events.emit('system.uncaughtException');
});

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cookieParser());
app.enable('trust proxy');

app.use((req, res, next) => {
  const start = Date.now();
  req.id = uuid.v4().slice(0, 8);
  req.userId = auth.decode(req.cookies.auth);
  req.log = logger.create(undefined, req);
  req.dal = dal;

  req.log.info(`${req.ip} ${req.userId || 'noauth'} request: ${req.path}`);
  req.on('end', () => {
    const time = Date.now() - start;
    req.log.info(`response [${res.statusCode}] ${time}ms`);
  });
  next();
});

apiRoutes.init(app);

app.get('*', function (req, res) {
  res.status(404).send('Not Found\n');
});

module.exports = app;

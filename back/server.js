const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const uuid = require('uuid');

const apiRoutes = require('./api/routes');
const auth = require('./utils/auth');
const autoCancelation = require('./utils/autoCancelation');
const dal = require('./dal/dal');
const logger = require('./utils/logger');
const utils = require('./utils/misc');

const app = express();
const config = utils.getConfig();
const log = logger.create('SERVER');

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

app.listen(config.server.port, config.server.host);
log.info(`listen on: ${config.server.host}:${config.server.port}`);

autoCancelation.startMonitoring();

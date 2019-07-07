const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const uuid = require('uuid');


const dal = require('./dal/dal');
const apiRoutes = require('./api/routes');
const utils = require('./utils/misc');
const logger = require('./utils/logger');
const auth = require('./utils/auth');
const log = logger.create('SERVER');
const config = utils.getConfig();
const app = express();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cookieParser());

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

// const autoCancelation = require('./autoCancelation');

// const bot = require('./telegram_bot');
// function makeError(msg) {
//   printError.apply(this, arguments);
//   return {
//     error: msg
//   };
// }

// function printError(msg) {
//   bot.send('owner', `Error: ${msg}`);
//   let args = [];
//   for (let key in arguments) {
//     args.push(arguments[key]);
//   }
//   args.unshift('Error:');
//   console.log.apply(this, args);
// }


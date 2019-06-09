const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');

const dal = require('./dal/dal');
const apiRoutes = require('./api/routes');
const utils = require('./utils/misc');
const logger = require('./utils/logger');

const log = logger.create('SERVER');
const config = utils.getConfig();
const app = express();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use((req, res, next) => {
  const start = Date.now();
  req.id = uuid.v4().slice(0, 8);
  req.userId = 'userId?';
  req.log = logger.create(undefined, req);
  req.dal = dal;

  req.log.info(`request: ${req.path}`);
  req.on('end', () => {
    const time = Date.now() - start;
    req.log.info(`request [${res.statusCode}]: ${req.path} (${time}ms)`);
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


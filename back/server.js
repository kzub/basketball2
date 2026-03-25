const app = require('./app');
const utils = require('./utils/misc');
const logger = require('./utils/logger');
const autoCancelation = require('./automation/expiredReservations');
const autoOpening = require('./automation/gameOpening');

const config = utils.getConfig();
const log = logger.create('SERVER');

const port = process.env.PORT || config.server.port;
const host = process.env.HOST || config.server.host;

app.listen(port, host);
log.info(`listen on: ${host}:${port}`);

// run tasks every minute
autoCancelation.act();
autoOpening.act();

setInterval(() => {
  autoCancelation.act();
  autoOpening.act();
}, 60000);

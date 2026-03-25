const app = require('./app');
const utils = require('./utils/misc');
const logger = require('./utils/logger');
const autoCancelation = require('./automation/expiredReservations');
const autoOpening = require('./automation/gameOpening');

const config = utils.getConfig();
const log = logger.create('SERVER');

app.listen(config.server.port, config.server.host);
log.info(`listen on: ${config.server.host}:${config.server.port}`);

// run tasks every minute
autoCancelation.act();
autoOpening.act();

setInterval(() => {
  autoCancelation.act();
  autoOpening.act();
}, 60000);

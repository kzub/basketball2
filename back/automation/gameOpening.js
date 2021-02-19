const dal = require('../dal/dal');
const events = require('../utils/notifications');
const logger = require('../utils/logger');
const utils = require('../utils/misc');

const log = logger.create('AUTO_OPEN');

const checkGamesToOpen = async () => {
  const games = await dal.game.getGamesList({
    autoOpen: true,
  });

  for(const game of games) {
    log.debug(`check game: ${game.gameId}/${game.date}/${game.timeStart}, for open: ${game.openingMode}/${game.openingDate}/${game.openingTime}`);
    const today = utils.getLocalTime().toJSON();
    const nowTime = today.slice(11, 16);
    const nowDate = today.slice(0, 10);

    const dateDiff = utils.compareDates(nowDate, game.openingDate);
    const timeDiff = utils.compareTimes(nowTime, game.openingTime);
    log.debug(`nowDate ${nowDate}, nowTime ${nowTime}, game.openingDate ${game.openingDate}, game.openingTime ${game.openingTime}, dateDiff ${dateDiff}, timeDiff ${timeDiff}`);
    if (dateDiff > 0 || (dateDiff == 0 && timeDiff >= 0)) {
      log.info(`time to open game: ${game.gameId}/${game.date}/${game.timeStart}, for open: ${game.openingMode}/${game.openingDate}/${game.openingTime}`);

      game.status = 'settled';
      await dal.game.updateGameStatus(game);
      game.openingMode = 'performed';
      await dal.game.updateGameOpenMode(game);

      events.emit('game.change.status.auto', {
        game
      });
    }
  }
};

const act = () => {
  checkGamesToOpen();
};

module.exports = {
  act,
};


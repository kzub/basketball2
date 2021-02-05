const dal = require('../dal/dal');
const events = require('../utils/notifications');
const logger = require('../utils/logger');

const log = logger.create('AUTO_CANCEL');

const checkExpiredReservations = async () => {
  const reservations = await dal.reservation.getExpired();
  for(const reservation of reservations) {
    log.info(`start canceling reservation: ${reservation.gameId}/${reservation.bookId}/${reservation.playerName}`);
    reservation.cancel();
    const ok = await dal.reservation.update(reservation);
    if (ok) {
      events.emit('reservation.expired', { reservation });
      const game = await dal.game.getGame(reservation.gameId);
      const promotedRsv = await dal.game.moveWaiters(game);
      if (promotedRsv) {
        events.emit('reservation.waiter.promoted', { reservation: promotedRsv });
      }
    }
  }
};

const act = () => {
  checkExpiredReservations();
};

module.exports = {
  act,
};


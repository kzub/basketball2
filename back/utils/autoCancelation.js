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
      const promotedRsvId = await dal.game.moveWaiters(reservation.gameId);
      if (promotedRsvId) {
        const promotedReservation = await dal.reservation.get(reservation.gameId, promotedRsvId);
        events.emit('reservation.waiter.promoted', { promotedReservation });
      }
    }
  }
};

const startMonitoring = () => {
  checkExpiredReservations();
  setInterval(checkExpiredReservations, 60000);
};

module.exports = {
  checkExpiredReservations,
  startMonitoring,
};


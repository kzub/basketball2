const events = require('../utils/notifications');

const complete = async (req, res) => {
  req.log.info(req.body);
  res.status(200).send('OK');
  const paySystem = req.params.paySystem;
  const amount = req.body.withdraw_amount;
  const label = req.body.label;

  const organizer = await req.dal.payment.findOrganizerByPaySystem(paySystem);
  if (!organizer) {
    events.emit('payment.unknown.paysystem', { paySystem, label, amount, ip: req.ip });
    // probably unauthorized attempt to emit payment
    return;
  }

  if (label && label.startsWith('RSV')) {
    const [, gameId, bookId, userId] = label.split('|');
    const paymentId = await req.dal.payment.addTransaction(organizer.userId, paySystem, amount, gameId, bookId, userId, req.body);
    
    const reservation = await req.dal.reservation.get(gameId, bookId);
    reservation.book();
    reservation.makePaid(amount);
    reservation.paymentId = paymentId;
    await req.dal.reservation.update(reservation);
    events.emit('reservation.paid', { reservation });
    return;
  }

  events.emit('payment.unknown', { paySystem, label, amount });
  req.dal.payment.addTransaction(0, paySystem, amount, req.body);
};


module.exports = {
  complete,
};

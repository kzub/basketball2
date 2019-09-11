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
    reservation.setExpire(0);
    reservation.paymentId = paymentId;
    await req.dal.reservation.update(reservation);
    events.emit('reservation.paid', { reservation });
    return;
  }

  if (label && label.startsWith('FP')) {
    const [, userId] = label.split('|');
    await req.dal.payment.addTransaction(organizer.userId, paySystem, amount, 0, 0, userId || 0, req.body);
    let user;

    if (userId) {
      user = await req.dal.user.getUser(userId);
    }

    events.emit('payment.custom', {
      amount,
      payerName: user && user.name,
      receiverName: organizer.name,
    });
    return;
  }

  events.emit('payment.unknown', { paySystem, label, amount });
  req.dal.payment.addTransaction(0, paySystem, amount, 0, 0, 0, req.body);
};

const getOrganizerYM = async (req, res) => {
  const allYMs = await req.dal.payment.getPaymentReciever(req.params.organizerId);
  const YMdata = allYMs
    .filter(d => d.paymentGateAccount == req.params.account)
    .pop();

  if (!YMdata) {
    req.log.error(`ERROR getOrganizerYM() YMdata not found for ${req.params.organizerId}/${req.params.account}`);
    res.status(400).send({
      error: true,
      reason: 'YM data not found',
    });
    return;
  }

  res.status(200).send({
    ok: true,
    ...YMdata
  });
};

const getAllOrganizerYMs = async (req, res) => {
  const YMs = await req.dal.payment.getPaymentReciever(req.userId);

  if (!YMs) {
    req.log.error(`ERROR getOrganizerYM() YMs not found for ${req.userId}`);
    res.status(400).send({
      error: true,
      reason: 'YMs data not found',
    });
    return;
  }

  res.status(200).send({
    ok: true,
    YMs,
  });
};

module.exports = {
  complete,
  getAllOrganizerYMs,
  getOrganizerYM,
};

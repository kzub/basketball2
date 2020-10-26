const events = require('../utils/notifications');
const utils = require('../utils/misc');
const payproxy = require('../connector/payproxy');

const config = utils.getConfig();

// ------------------------------------------------------------------------------
const onReservationPayment = async (req, paySystem, amount, labelData, organizer) => {
  const [gameId, bookId, userId, strCreditsToUse] = labelData;
  const creditsToUse = Number(strCreditsToUse);
  let amountForRsv = Number(amount);

  const paymentId = await req.dal.payment.addTransaction(organizer.userId, paySystem, amount, gameId, bookId, userId, req.body);

  const reservation = await req.dal.reservation.get(gameId, bookId);
  if (reservation.userId != userId) {
    events.emit('payment.wrong.userId', { userId, reservation });
    return;
  }

  const game = await req.dal.game.getGame(gameId);
  if (amount < game.paymentAmount) {
    const currentCreditsObj = await req.dal.payment.getUserCreditsForOrganizerId(userId, organizer.userId);
    const currentCredits = (currentCreditsObj && currentCreditsObj.total) || 0;

    if (!creditsToUse || (amount + creditsToUse < game.paymentAmount) || (currentCredits < creditsToUse)) {
      events.emit('payment.wrong.amount', { game, amount, creditsToUse, currentCredits });
      return;
    }

    await req.dal.payment.addCreditTransaction(userId, organizer.userId, -creditsToUse, 'reservation.pay', reservation.bookId);
    amountForRsv = amount + creditsToUse;
  }

  reservation.makePaid(amountForRsv);
  reservation.setExpire(0);
  reservation.paymentId = paymentId;
  await req.dal.reservation.update(reservation);
  events.emit('reservation.paid', { reservation });

  // refund previous player with canceled reservation if there are any of them
  if (game.isPrepay()) {
    const rsvs = await req.dal.game.getNotRefundedCanceledReservations(gameId);
    if (rsvs.length) {
      const reservation = rsvs[0];
      req.log.info(`onReservationPayment(), new payment will refund ${reservation.gameId}/${reservation.bookId}`);
      const refundAmount = reservation.paymentAmount;
      await req.dal.payment.addCreditTransaction(reservation.userId, game.organizer.userId, refundAmount, 'reservation.cancel', reservation.bookId, 'new payment');
      events.emit('user.credits.added', {
        gameId,
        playerName: reservation.playerName,
        receiverName: game.organizer.name,
        amount: refundAmount,
      });
    }
  }
};

// ------------------------------------------------------------------------------
const onReservationPostPay = async (req, paySystem, amount, labelData, organizer) => {
  const [gameId, bookId, userId] = labelData;

  const paymentId = await req.dal.payment.addTransaction(organizer.userId, paySystem, amount, gameId, bookId, userId, req.body);
  const reservation = await req.dal.reservation.get(gameId, bookId);

  reservation.makePaid(amount);
  reservation.setExpire(0);
  reservation.paymentId = paymentId;
  await req.dal.reservation.update(reservation);
  events.emit('reservation.postpay.paid', { reservation });
};

// ------------------------------------------------------------------------------
const onFreePayment = async (req, paySystem, amount, labelData, organizer) => {
  const [userId, sender] = labelData;
  await req.dal.payment.addTransaction(organizer.userId, paySystem, amount, 0, 0, userId || 0, req.body);
  let user;

  if (userId) {
    user = await req.dal.user.getUser(userId);
  }

  events.emit('payment.custom', {
    amount,
    payerName: (user && user.name) || sender,
    receiverName: organizer.name,
  });
};

// ------------------------------------------------------------------------------
const complete = async (req, res) => {
  req.log.info(req.body);
  res.status(200).send('OK');
  const paySystem = req.params.paySystem;
  const amount = Number(req.body.withdraw_amount);
  const label = req.body.label || '';

  const [paymentEnvironment, paymentEvent, ...labelData] = label.split('|');
  if (config.payproxy.backends && paymentEnvironment != config.payproxy.env) {
    req.log.info(`proxy payment to ${paymentEnvironment}`);
    payproxy.proxyPayment(paymentEnvironment, req);
    return;
  }

  const organizer = await req.dal.payment.findOrganizerByPaySystem(paySystem);
  if (!organizer) {
    // attempt to emulate a payment?
    events.emit('payment.unknown.paysystem', { paySystem, label, amount, ip: req.ip });
    return;
  }

  if (paymentEvent === 'RSV') {
    onReservationPayment(req, paySystem, amount, labelData, organizer);
    return;
  }

  if (paymentEvent === 'FP') {
    onFreePayment(req, paySystem, amount, labelData, organizer);
    return;
  }

  if (paymentEvent === 'RPP') {
    onReservationPostPay(req, paySystem, amount, labelData, organizer);
    return;
  }

  events.emit('payment.unknown', { paySystem, label, amount });
  req.dal.payment.addTransaction(0, paySystem, amount, 0, 0, 0, req.body);
};

// ------------------------------------------------------------------------------
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

// ------------------------------------------------------------------------------
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

// ------------------------------------------------------------------------------
const getCreditors = async (req, res) => {
  const creditors = await req.dal.payment.getCreditors(req.userId);
  const userNames = await req.dal.user.getUsers(creditors.map(c => c.userId));

  const creditorsWithName = creditors.map(creditor => {
    return {
      ...creditor,
      name: userNames.filter(user => user.userId == creditor.userId).pop().name,
    };
  });

  const realCreditors = creditorsWithName.filter(creditor => creditor.total > 0);
  realCreditors.sort((a, b) => {
    return b.total - a.total;
  });

  res.status(200).send({
    ok: true,
    creditorsList: realCreditors,
  });
};

module.exports = {
  complete,
  getAllOrganizerYMs,
  getCreditors,
  getOrganizerYM,
};

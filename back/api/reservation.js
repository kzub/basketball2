const events = require('../utils/notifications');
// ----------------------------------------------------------------------------------
const book = async (req, res) => {
  const { gameId, slotType } = req.body;
  const user = await req.dal.user.getUser(req.userId);
  const game = await req.dal.game.getGame(gameId);
  const isGameAdmin = game.isAdminUser(user);

  if (!isGameAdmin && game.isTimePassed()) {
    req.log.error(`book() not game admin try to book slot for passed game, ${gameId}/${req.userId}`);
    res.status(200).send({ ok: false });
    return;
  }

  if (!user || !user.name) {
    req.log.error(`book() no user name userId: ${req.userId}, user: ${JSON.stringify(user)}`);
    res.status(200).send({ ok: false });
    return;
  }

  let bookId = 0;
  const ttl = game.newReservationTTL(slotType);
  if (game.freeSlotExists(slotType)) {
    bookId = await req.dal.reservation.create(gameId, slotType, ttl, user);
  }

  if (bookId > 0) {
    if (slotType === 'player') {
      game.freePlayerSlots--;
    } else {
      game.freeWaiterSlots--;
    }
    events.emit(`reservation.${slotType}.new`, { game, user, ttl });
  }

  res.status(200).send({
    result: bookId > 0 ? 'ok' : 'error',
    gameId,
    bookId,
    freePlayerSlots: game.freePlayerSlots,
    freeWaiterSlots: game.freeWaiterSlots,
  });
};

// ----------------------------------------------------------------------------------
const changePay = async (req, res) => {
  const { gameId, bookId } = req.params;
  const user = await req.dal.user.getUser(req.userId);
  const game = await req.dal.game.getGame(gameId);
  const reservation = await req.dal.reservation.get(gameId, bookId);

  let ok = false;
  let reason;

  if (!game.isAdminUser(user)) {
    reason = 'you are not game admin';
    req.log.error(`Not a game admin try to change payment status for ${gameId}/${bookId}`);
  } else if (reservation.realPaymentComplete()) {
    reason = 'real payment cannot be canceled';
    req.log.error(`Game admin try to change real payment status for ${gameId}/${bookId}`);
  } else {
    let event;
    if (reservation.isPaid()) {
      reservation.makeUnpaid();
      event = 'reservation.admin.make.unpaid';
    } else {
      reservation.makePaid();
      reservation.setExpire(0);
      event = 'reservation.admin.make.paid';
    }
    ok = await req.dal.reservation.update(reservation);
    events.emit(event, { reservation });
  }

  res.status(200).send({ ok, reason });
};

// ----------------------------------------------------------------------------------
const clearExpire = async (req, res) => {
  const { gameId, bookId } = req.params;
  const user = await req.dal.user.getUser(req.userId);
  const game = await req.dal.game.getGame(gameId);
  const reservation = await req.dal.reservation.get(gameId, bookId);

  let ok = false;
  let reason;

  if (!game.isAdminUser(user)) {
    reason = 'you are not game admin';
    req.log.error(`Not a game admin try to change game status for ${gameId}/${bookId}`);
  } else {
    reservation.setExpire(0);
    ok = await req.dal.reservation.update(reservation);
    events.emit('reservation.admin.clear.expiration', { reservation });
  }

  res.status(200).send({ ok, reason });
};

// ----------------------------------------------------------------------------------
const payByCredits = async (req, res) => {
  const { gameId, bookId } = req.params;
  const game = await req.dal.game.getGame(gameId);
  const reservation = await req.dal.reservation.get(gameId, bookId);

  if (!reservation.isOwnerUserId(req.userId)) {
    req.log.error(`Not a reservation owner try to user credits ${gameId}/${bookId}`);
    res.status(200).send({ ok: false, reason: 'you are not a reservation owner' });
    return;
  }

  if (reservation.isPaid()) {
    req.log.error(`try to pay by credits reservation already paid ${gameId}/${bookId}`);
    res.status(200).send({ ok: false, reason: 'reservation already paid' });
    return;
  }

  const currentCredits = await req.dal.payment.getUserCreditsForOrganizerId(req.userId, game.organizer.userId);
  if (currentCredits.total < game.paymentAmount) {
    req.log.error(`to enough credits for reservation pay ${gameId}/${bookId}`);
    res.status(200).send({ ok: false, reason: 'not enought credits for reservation' });
    return;
  }

  // userId, organizerId, amount, sourceType, sourceId = null, comment = null
  const creditTransId = await req.dal.payment.addCreditTransaction(
    req.userId, game.organizer.userId, -game.paymentAmount, 'reservation.pay', bookId
  );

  // recipientId, paySystem, amount, gameId, bookId, userId, rawData
  const paymentId = await req.dal.payment.addTransaction(
    game.organizer.userId, 'credits', game.paymentAmount, gameId, bookId, req.userId, {
      creditTransactionId: creditTransId,
    }
  );

  reservation.makePaid(game.paymentAmount);
  reservation.setExpire(0);
  reservation.paymentId = paymentId;

  const ok = await req.dal.reservation.update(reservation);
  events.emit('reservation.paid', { reservation });

  res.status(200).send({ ok });
};

// ----------------------------------------------------------------------------------
const setPlayer = async (req, res) => {
  const { gameId, bookId, name } = req.params;
  const user = await req.dal.user.getUser(req.userId);
  const game = await req.dal.game.getGame(gameId);
  const reservation = await req.dal.reservation.get(gameId, bookId);

  let ok = false;
  if (name && (game.isAdminUser(user) ||
     (reservation.isOwnerUser(user) && !game.isTimePassed()))) {
    const oldPlayerName = reservation.playerName;
    reservation.playerName = name;
    ok = await req.dal.reservation.update(reservation);
    events.emit('reservation.change.name', { reservation, oldPlayerName });
  }
  res.status(200).send({ ok });
};

// ----------------------------------------------------------------------------------
const getTransferCode = async (req, res) => {
  const { gameId, bookId } = req.params;
  const user = await req.dal.user.getUser(req.userId);
  const game = await req.dal.game.getGame(gameId);
  const reservation = await req.dal.reservation.get(gameId, bookId);

  let ok = false;
  let transferCode;
  if ((reservation.isOwnerUser(user) && reservation.isPlayer() && !game.isTimePassed())) {
    transferCode = await req.dal.transfer.create(gameId, bookId, user.userId);
  }
  res.status(200).send({ ok, transferCode });
};

// ----------------------------------------------------------------------------------
const getTransferDetails = async (req, res) => {
  const { transferCode } = req.params;
  const transferDetails = await req.dal.transfer.get(transferCode);
  if (!transferDetails) {
    res.status(200).send({ ok: false });
    return;
  }

  const gameDetails = await req.dal.game.getGameDetails(transferDetails.gameId);

  res.status(200).send({ ok: true, gameDetails, transferDetails });
};

// ----------------------------------------------------------------------------------
const doTransfer = async (req, res) => {
  let ok;
  const user = await req.dal.user.getUser(req.userId);
  const { transferCode } = req.params;
  const transferDetails = await req.dal.transfer.get(transferCode);

  if (!transferDetails) {
    req.log.error(`doTransfer():req.dal.transfer.get() error:
      ${transferDetails.gameId}/${transferDetails.bookId}/${req.userId}/${transferCode}`);
    res.status(200).send({ ok: false });
    return;
  }

  const reservation = await req.dal.reservation.get(transferDetails.gameId, transferDetails.bookId);
  const oldPlayerName = reservation.playerName;
  reservation.userId = user.userId; // set new reservation's owner
  reservation.playerName = user.name;
  ok = await req.dal.reservation.update(reservation);
  if (!ok) {
    req.log.error(`doTransfer():req.dal.reservation.update() error:
      ${transferDetails.gameId}/${transferDetails.bookId}/${req.userId}/${transferCode}`);
    res.status(200).send({ ok: false });
    return;
  }

  transferDetails.newPlayerId = user.userId;
  ok = await req.dal.transfer.finish(transferDetails);
  if (!ok) {
    req.log.error(`doTransfer():req.dal.transfer.finish() error:
      ${transferDetails.gameId}/${transferDetails.bookId}/${user.userId}/${transferCode}`);
    res.status(200).send({ ok: false });
    return;
  }

  events.emit('reservation.transfer', { reservation, oldPlayerName });

  res.status(200).send({ ok: true });
};

// ----------------------------------------------------------------------------------
const cancel = async (req, res) => {
  const { gameId, bookId } = req.params;
  const user = await req.dal.user.getUser(req.userId);
  const game = await req.dal.game.getGame(gameId);
  const reservation = await req.dal.reservation.get(gameId, bookId);
  const isWaiter = reservation.isWaiter();
  const isGameAdmin = game.isAdminUser(user);

  if ((!isGameAdmin && !reservation.isOwnerUser(user)) ||
      (!isGameAdmin && game.isTimePassed()) ||
      reservation.isCanceled()) {
    req.log.error(`cancel() illegal try to cancel game, ${gameId}/${req.userId}`);
    res.status(200).send({ ok: false });
    return;
  }

  reservation.cancel();
  const ok = await req.dal.reservation.update(reservation);
  if (!ok) {
    req.log.error(`cancel():req.dal.reservation.update() error, ${gameId}/${reservation.bookId}/${req.userId}`);
    res.status(200).send({ ok: false });
    return;
  }

  const who = isGameAdmin ? 'admin' : (isWaiter ? 'waiter' : 'player');
  const eventName = `reservation.${who}.cancel.${reservation.paymentStatus}`;
  events.emit(eventName, { reservation, isWaiter });

  if (isWaiter || game.isTimePassed()) {
    res.status(200).send({ ok: true });
    return;
  }

  const promotedRsv = await req.dal.game.moveWaiters(game);
  if (promotedRsv) {
    events.emit('reservation.waiter.promoted', { reservation: promotedRsv });
  }

  let refundAmount;
  if (game.isPrepay() && reservation.isPaid() && game.hoursToGameBegin() >= 24) {
    req.log.info(`reservation.cancel() Reservation ${gameId}/${bookId} is REFUNDABLE`);
    refundAmount = Math.ceil(reservation.paymentAmount * 0.9);
    await req.dal.payment.addCreditTransaction(reservation.userId, game.organizer.userId, refundAmount, 'reservation.cancel', reservation.bookId);
    events.emit('user.credits.added', {
      playerName: reservation.playerName,
      receiverName: game.organizer.name,
      amount: refundAmount,
    });
  } else {
    req.log.info(`reservation.cancel() Reservation ${gameId}/${bookId} is NOT REFUNDABLE`);
  }

  res.status(200).send({ ok: true, refundAmount });
};

// ----------------------------------------------------------------------------------
module.exports = {
  book,
  cancel,
  changePay,
  clearExpire,
  doTransfer,
  getTransferCode,
  getTransferDetails,
  payByCredits,
  setPlayer,
};
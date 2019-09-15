const events = require('../utils/notifications');
const { newReservationTTL, waiterReservationTTL } = require('../dal/types');

const book = async (req, res) => {
  const { gameId, slotType } = req.body;
  const user = await req.dal.user.getUser(req.userId);
  const game = await req.dal.game.getGame(gameId);

  let bookId = 0;
  let ttl = 0;
  if (game.freeSlotExists(slotType)) {
    if (game.isPrepay() && slotType === 'player') {
      ttl = newReservationTTL;
    }
    bookId = await req.dal.reservation.create(gameId, slotType, ttl, user);
  }

  if (bookId > 0) {
    if (slotType === 'player') {
      game.freePlayerSlots--;
    } else {
      game.freeWaiterSlots--;
    }
    events.emit('reservation.new', { game, bookId, user, slotType });
  }

  res.status(200).send({
    result: bookId > 0 ? 'ok' : 'error',
    gameId,
    bookId,
    freePlayerSlots: game.freePlayerSlots,
    freeWaiterSlots: game.freeWaiterSlots,
  });
};

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
    reservation.book();
    reservation.setExpire(0);
    ok = await req.dal.reservation.update(reservation);
    events.emit('reservation.admin.make.book', { reservation });
  }

  res.status(200).send({ ok, reason });
};

const setPlayer = async (req, res) => {
  const { gameId, bookId, name } = req.params;
  const user = await req.dal.user.getUser(req.userId);
  const game = await req.dal.game.getGame(gameId);
  const reservation = await req.dal.reservation.get(gameId, bookId);

  let ok = false;
  if (game.isAdminUser(user) || reservation.isOwnerUser(user)) {
    reservation.playerName = name;
    ok = await req.dal.reservation.update(reservation);
  }
  res.status(200).send({ ok });
};

const cancel = async (req, res) => {
  const { gameId, bookId } = req.params;
  const user = await req.dal.user.getUser(req.userId);
  const game = await req.dal.game.getGame(gameId);
  const reservation = await req.dal.reservation.get(gameId, bookId);
  const isWaiter = reservation.isWaiter();
  const isGameAdmin = game.isAdminUser(user);

  if ((!isGameAdmin && !reservation.isOwnerUser(user)) || reservation.isCanceled()) {
    res.status(200).send({ ok: false });
    return;
  }

  reservation.cancel();
  const ok = await req.dal.reservation.update(reservation);
  if (!ok) {
    res.status(200).send({ ok: false });
    return;
  }

  let event;
  if (isGameAdmin) {
    event = reservation.isPaid() ? 'reservation.admin.cancel.paid' : 'reservation.admin.cancel.unpaid';
  } else {
    event = reservation.isPaid() ? 'reservation.canceled.paid' : 'reservation.canceled.unpaid';
  }
  events.emit(event, { reservation, isWaiter });

  if (isWaiter) {
    res.status(200).send({ ok });
    return;
  }

  const ttl = game.isPrepay() ? waiterReservationTTL : 0;
  const promotedRsvId = await req.dal.game.moveWaiters(gameId, ttl);
  if (promotedRsvId) {
    const promotedReservation = await req.dal.reservation.get(gameId, promotedRsvId);
    events.emit('reservation.waiter.promoted', { reservation: promotedReservation });
  }

  if (game.isRefundable() && reservation.realPaymentComplete()) {
    req.log.debug('reservation is REFUNDABLE');
    // userId, organizerId, amount, sourceType, sourceId, comment
    await req.dal.payment.addCreditTransaction(reservation.userId, game.organizer.userId, reservation.paymentAmount, 'reservation.cancel', reservation.bookId);
    events.emit('user.credits.added', {
      userId: reservation.userId,
      organizerId: game.organizer.userId,
      amount: reservation.paymentAmount,
    });
  } else {
    req.log.debug('reservation is NOT REFUNDABLE');
  }

  res.status(200).send({ ok });
};

module.exports = {
  book,
  cancel,
  changePay,
  clearExpire,
  setPlayer,
};
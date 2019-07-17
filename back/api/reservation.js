const book = async (req, res) => {
  const { gameId, slotType } = req.body;
  const user = await req.dal.user.getUser(req.userId);
  const game = await req.dal.game.getGame(gameId);

  let bookId = 0;
  if ((slotType === 'player' && game.freePlayerSlots > 0) ||
      (slotType === 'waiter' && game.freeWaiterSlots > 0) ) {
    bookId = await req.dal.reservation.create(gameId, slotType, user);
  }

  res.status(200).send({
    result: bookId > 0 ? 'booked' : 'error',
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
  let reason = undefined;

  if (!game.isAdmin(user)) {
    reason = 'you are not game admin';
    req.log.error(`Not a game admin try to change payment status for ${gameId}/${bookId}`);
  } else if (reservation.realPaymentComplete()) {
    reason = 'real payment cannot be canceled';
    req.log.error(`Game admin try to change real payment status for ${gameId}/${bookId}`);
  } else {
    if (reservation.isPaid()) {
      reservation.makeUnpaid();
    } else {
      reservation.makePaid();
    }
    ok = await req.dal.reservation.update(reservation);
  }

  res.status(200).send({ ok, reason });
};

const setPlayer = async (req, res) => {
  const { gameId, bookId, name } = req.params;
  const user = await req.dal.user.getUser(req.userId);
  const game = await req.dal.game.getGame(gameId);
  const reservation = await req.dal.reservation.get(gameId, bookId);

  let ok = false;
  if (game.isAdmin(user) || reservation.isOwner(user)) {
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

  let ok = false;
  if (game.isAdmin(user) || reservation.isOwner(user)) {
    reservation.status  = 'canceled';
    ok = await req.dal.reservation.update(reservation);
  }
  res.status(200).send({ ok });
};

module.exports = {
  book,
  cancel,
  setPlayer,
  changePay,
};
const complete = async (req, res) => {
  res.status(200).send('OK');
  
  const paySystem = req.params.paySystem;
  const amount = req.body.withdraw_amount;
  const label = req.body.label;

  if (label.startsWith('RSV')) {
    const [, gameId, bookId] = label.split('|');

    const organizerId = await req.dal.game.getGameOrganizerId(gameId);
    const paymentId = await req.dal.payment.addTransaction(organizerId, paySystem, amount, req.body);
    
    const reservation = await req.dal.reservation.get(gameId, bookId);
    reservation.status  = 'booked';
    reservation.makePaid(amount);
    reservation.paymentId = paymentId;
    await req.dal.reservation.update(reservation);
    // notify all
    //   autoCancelation.del(game.id, player);
    return;
  }

  req.dal.payment.addTransaction(0, paySystem, amount, req.body);
};


module.exports = {
  complete,
};

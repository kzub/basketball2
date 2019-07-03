const book = async (req, res) => {
  req.log.info(`book: ${JSON.stringify(req.body)}`);

  const { gameId, slotType } = req.body;
  const user = await req.dal.user.getUser(req.userId);
  const game = await req.dal.game.getGame(gameId);

  const bookId = await req.dal.reservation.create(gameId, slotType, user);

  res
    .status(200)
    .send({
      result: bookId > 0 ? 'booked' : 'error',
      gameId: gameId,
      bookId: bookId,
    });
};

const get = async (req, res) => {
  req.log.info(`rsv get: ${req.params.gameId}, ${req.params.bookId}`);
  res.status(200).send({});
};

module.exports = {
	book,
	get,
};
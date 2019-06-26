const game = async (req, res) => {
	if (!isFinite(req.params.gameId)) {
		throw new Error('api.game: gameId not number')
	}
	
	const game = await req.dal.games.getGame(req.params.gameId);
	res.status(200).send(game);
};

module.exports = game;

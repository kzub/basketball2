const games = async (req, res) => {
	const gamesList = await req.dal.games.getGamesList();
	res.status(200).send(gamesList);
};

module.exports = games;

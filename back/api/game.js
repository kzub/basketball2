const db = require('./dbemulator');

const game = async (req, res) => {
	const games = await db.getGameData();
	res.status(200).send(games);
};

module.exports = game;

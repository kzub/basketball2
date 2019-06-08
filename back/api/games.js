const db = require('./dbemulator');

const games = async (req, res) => {
	const gamesList = await db.getGamesList();
	res.status(200).send(gamesList);
};

module.exports = games;

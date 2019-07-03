const game = async (req, res) => {
	if (!isFinite(req.params.gameId)) {
		throw new Error('api.game: gameId not number')
	}

	const gameDetails = await req.dal.game.getGameDetails(req.params.gameId);

	if (req.userId && req.userId === gameDetails.game.organizer.userId) {
		const userlist = []
		.concat(
			gameDetails.players.map(p => p.userId),
			gameDetails.waiters.map(p => p.userId)
		)
		.filter(userId => userId !== 0)
		.reduce((list, userId) => {
			if (list.indexOf(userId) === -1) {
				list.push(userId);
			}
			return list;
		}, []);
		
		const users = await req.dal.user.getUsers(userlist);
		gameDetails.users = users;
	}

	res.status(200).send(gameDetails);
};

module.exports = game;

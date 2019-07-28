const { Game } = require('../dal/types');
const events = require('../utils/notifications');

const get = async (req, res) => {
  if (!isFinite(req.params.gameId)) {
    throw new Error('api.game: gameId not number');
  }

  const gameDetails = await req.dal.game.getGameDetails(req.params.gameId);

  if (!gameDetails || (gameDetails.game.isDisabled() && 
      req.userId !== gameDetails.game.organizer.userId)) {
    res.status(200).send({
      error: true,
      reason: 'game disabled or not exists',
    });
    return;
  }

  if (req.userId === gameDetails.game.organizer.userId) {
    // add players personal data to the response
    const userlist = [].concat(
      gameDetails.players.map(p => p.userId),
      gameDetails.waiters.map(p => p.userId))
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

// ---------- admin parts -----------------------
const add = async (req, res) => {
  const gameData = req.body;
  const organizer = await req.dal.users.findOrganizerByUserId(req.userId);
  const place = await req.dal.place.getPlace(gameData.place.placeId);

  if (!organizer.adminOf(place.placeId)) {
    res.status(403).send({
      error: true,
      reason: 'you are not place admin',
    });
    return;
  }

  // check if notify are exists
  const notify = await req.dal.notification.getNotification(gameData.notifyId); // eslint-disable-line no-unused-vars

  gameData.place = place;
  gameData.organizer = organizer;
  const game = new Game(gameData);

  const gameId = await req.dal.game.addGame(game);

  res.status(200).send({ ok: true, gameId });
};

const changeStatus = async (req, res) => {
  const { gameId, status } = req.params;
  const gameDetails = await req.dal.game.getGameDetails(gameId);

  if (req.userId !== gameDetails.game.organizer.userId) {
    res.status(403).send({
      error: true,
      reason: 'you are not game admin',
    });
    return;
  }

  gameDetails.game.status = status;
  await req.dal.game.updateGame(gameDetails.game);

  events.emit('game.change.status', {
    game: gameDetails.game,
    status,
  });

  res.status(200).send(gameDetails);
};


module.exports = {
  add,
  changeStatus,
  get,
};

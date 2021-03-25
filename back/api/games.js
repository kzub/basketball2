const list = async (req, res) => {
  const gamesList = await req.dal.game.getGamesList();
  const showList = gamesList.filter(game => {
    if (game.isAutoOpening()) {
      return true;
    }
    if (game.isDisabled() && !game.isAdminUserId(req.userId)) {
      return false;
    }
    if (game.isTimePassed()) {
      return false;
    }
    return true;
  });

  res.status(200).send(showList);
};

const my = async (req, res) => {
  const gamesList = await req.dal.game.getGamesList({ organizerId: req.userId });
  res.status(200).send(gamesList);
};

module.exports = {
  list,
  my,
};

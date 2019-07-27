const list = async (req, res) => {
  const gamesList = await req.dal.game.getGamesList();
  const showList = gamesList.filter(game => {
    if (game.status === 'disabled' && game.organizer.userId !== req.userId) {
      return false;
    }
    return true;
  });

  res.status(200).send(showList);
};

const my = async (req, res) => {
  const gamesList = await req.dal.game.getGamesList({ showLastMonth: true });
  const showList = gamesList.filter(game => game.organizer.userId === req.userId);

  res.status(200).send(showList);
};

module.exports = {
  list,
  my,
};

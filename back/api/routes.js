const wrapper = (func) => {
  return (req, res, ...args) => {
    func(req, res, ...args).catch(err => {
      req.log.error(`${err.message}\n${err.stack}`);
      res.status(500).send(err.message);
    });
  };
};

const init = (app) => {
  app.post('/api/book', wrapper(require('./book')));
  app.get('/api/user', wrapper(require('./user')));
  app.get('/api/game/:gameId', wrapper(require('./game')));
  app.get('/api/games', wrapper(require('./games')));
};

module.exports = { init };

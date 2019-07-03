const user = require('./user');
const game = require('./game');
const games = require('./games');
const reservation = require('./reservation');

const wrapper = (func, needAuth, statusCode = 401) => {
  return (req, res, ...args) => {
    if (needAuth && !req.userId) {
      res.status(statusCode).send({
        error: true,
        auth: false,
      });
      return;
    }
    func(req, res, ...args)
    .catch(err => {
      req.log.error(`${err.message}\n${err.stack}`);
      res.status(500).send(err.message);
    });
  };
};

const init = (app) => {
  app.post('/api/reservation/book', wrapper(reservation.book, true));
  // app.get('/api/reservation/:gameId/:bookId', wrapper(reservation.get, true));
  app.get('/api/user/get', wrapper(user.get, true, 200));
  app.get('/api/user/set/:name', wrapper(user.set, true));
  app.get('/api/user/verify/:phone', wrapper(user.verify, false));
  app.get('/api/user/auth/:phone/:code', wrapper(user.auth, false));
  app.get('/api/game/:gameId', wrapper(game, false));
  app.get('/api/games', wrapper(games, false));
};

module.exports = { init };

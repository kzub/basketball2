const rateLimit = require('express-rate-limit');

const game = require('./game');
const games = require('./games');
const payment = require('./payment');
const reservation = require('./reservation');
const user = require('./user');

const wrapper = (func, needAuth, statusCode = 401) => {
  return (req, res, ...args) => {
    if (needAuth && !req.userId) {
      req.log.error(`need auth for ${req.path}`);
      res.status(statusCode).send({
        error: true,
        auth: false,
      });
      return;
    }
    func(req, res, ...args).catch(err => {
      // console.log(err)
      req.log.error(`${err.message}\n${err.stack}`);
      if (!res.headersSent) {
        res.status(500).send(err.message);
      }
    });
  };
};

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 10, // limit each IP to 100 requests per windowMs
  handler: (req, res, next) => { // function to handle requests once the max limit is exceeded
    if (req.userId) {
      req.log.warn(`Too many requests from user: ${req.userId}`);
      next();
      return;
    }
    res.status(429).send('Too many requests, please try again later.');
  }
});

const smsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5
});

const init = (app) => {
  app.use(apiLimiter);
  app.post('/api/reservation/book', wrapper(reservation.book, true));
  app.get('/api/reservation/setPlayer/:gameId/:bookId/:name', wrapper(reservation.setPlayer, true));
  app.get('/api/reservation/cancel/:gameId/:bookId/', wrapper(reservation.cancel, true));
  app.get('/api/reservation/changePay/:gameId/:bookId/', wrapper(reservation.changePay, true));
  app.get('/api/user/get', wrapper(user.get, false));
  app.get('/api/user/exit', wrapper(user.exit, true));
  app.get('/api/user/set/:name', wrapper(user.set, true));
  app.get('/api/user/sendCheckCode/:phone', smsLimiter, wrapper(user.sendCheckCode, false));
  app.get('/api/user/auth/:phone/:code', wrapper(user.auth, false));
  app.get('/api/game/:gameId', wrapper(game, false));
  app.get('/api/games', wrapper(games, false));
  app.post('/api/payment/complete/:paySystem', wrapper(payment.complete, false));
};

module.exports = { init };

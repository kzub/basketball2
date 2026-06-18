const rateLimit = require('express-rate-limit');

const game = require('./game');
const games = require('./games');
const payment = require('./payment');
const tgBot = require('./tg.bot');
const reservation = require('./reservation');
const user = require('./user');
const system = require('./system');
const events = require('../utils/notifications');

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
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 75, // limit each IP to N requests per windowMs
  handler: (req, res, next) => { // function to handle requests once the max limit is exceeded
    events.emit('request.limit', { userId: req.userId, ip: req.ip });
    req.log.warn(`Too many requests from user: ${req.userId}, ip: ${req.ip}`);
    res.status(429).send('Too many requests, please try again later.');
  }
});

const smsLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5,
  handler: (req, res, /*next*/) => { // function to handle requests once the max limit is exceeded
    events.emit('request.limit.sms', { phone: req.params.phone, ip: req.ip });
    req.log.warn(`Too many sms sent to: ${req.params.phone}, by: ${req.ip}`);
    res.status(429).send('Too many requests, please try again later.');
  }
});

const init = (app) => {
  app.use('/api', apiLimiter);
  app.get('/api/status', system.status);
  app.get('/api/game/askToPay/:gameId', wrapper(game.askToPay, true));
  app.get('/api/game/changeStatus/:gameId/:status', wrapper(game.changeStatus, true));
  app.get('/api/game/clone/:gameId/:times/:clearPayment?', wrapper(game.clone, true));
  app.get('/api/game/details/:gameId/:force?', wrapper(game.get, false));
  app.get('/api/game/disableAutoOpen/:gameId', wrapper(game.disableAutoOpen, true));
  app.get('/api/game/options', wrapper(game.getOptions, true));
  app.get('/api/game/sendPlayerList/:gameId', wrapper(game.sendPlayerList, true));
  app.get('/api/games', wrapper(games.list, false));
  app.get('/api/games/my', wrapper(games.my, true));
  app.get('/api/payment/getAllOrganizerYMs/', wrapper(payment.getAllOrganizerYMs, true));
  app.get('/api/payment/getCreditors', wrapper(payment.getCreditors, true));
  app.get('/api/payment/getOrganizerYM/:organizerId/:account', wrapper(payment.getOrganizerYM, false));
  app.get('/api/payment/deleteDebt/:userId', wrapper(payment.deleteDebt, true));
  app.get('/api/payment/getStatistics', wrapper(payment.getPaymentsStatistics, true));
  app.get('/api/reservation/cancel/:gameId/:bookId/', wrapper(reservation.cancel, true));
  app.get('/api/reservation/changePay/:gameId/:bookId/', wrapper(reservation.changePay, true));
  app.get('/api/reservation/clearExpire/:gameId/:bookId/', wrapper(reservation.clearExpire, true));
  app.get('/api/reservation/doTransfer/:transferCode', wrapper(reservation.doTransfer, true));
  app.get('/api/reservation/getTransferCode/:gameId/:bookId', wrapper(reservation.getTransferCode, true));
  app.get('/api/reservation/getTransferDetails/:transferCode', wrapper(reservation.getTransferDetails, true));
  app.get('/api/reservation/mightBePaid/:gameId/:bookId/', wrapper(reservation.mightBePaid, true));
  app.get('/api/reservation/payByCredits/:gameId/:bookId/', wrapper(reservation.payByCredits, true));
  app.get('/api/reservation/setPlayer/:gameId/:bookId/:name', wrapper(reservation.setPlayer, true));
  app.get('/api/user/auth/:phone/:code/:redirect?', wrapper(user.auth, false));
  app.get('/api/user/exit', wrapper(user.exit, true));
  app.get('/api/user/get/:code?/:isLink?', wrapper(user.get, false));
  app.get('/api/user/getLoginLinkByPhone/:phone', wrapper(user.getLoginLinkByPhone, true));
  app.get('/api/user/getUserAuthById/:id', wrapper(user.getUserAuthById, true));
  app.get('/api/user/getUserAuthByPhone/:phone', wrapper(user.getUserAuthByPhone, true));
  app.get('/api/user/sendCheckCode/:phone', smsLimiter, wrapper(user.sendCheckCode, false));
  app.get('/api/user/set/:name', wrapper(user.set, true));
  app.post('/api/game/add', wrapper(game.add, true));
  app.post('/api/payment/complete/:paySystem', wrapper(payment.complete, false));
  app.post('/api/reservation/book', wrapper(reservation.book, true));
  app.post('/api/tgbot/:token', wrapper(tgBot.incommingWebhook, false));
};

module.exports = { init };

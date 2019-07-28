const dal = require('../dal/dal');
const EventEmitter = require('events');
const logger = require('./logger');
const telegram = require('../connector/telegram');
const utils = require('../utils/misc');

const config = utils.getConfig();
const emitter = new EventEmitter();
const log = logger.create('NOTIFY');

// --------------------- SITE ADMIN NOTIFICATIONS ------------------------
const sendAdminMessage = async (msg, type) => {
  log[type](msg);
  telegram.send(config.telegram.token, config.telegram.owner, `[ADMIN] ${msg}`);
};

emitter.on('user.sms', async ({ phone, code }) => {
  sendAdminMessage(`sent sms to user: ${phone}, code: ${code}`, 'info');
});

emitter.on('user.new', async ({ phone }) => {
  sendAdminMessage(`new user confirmed: ${phone}`, 'info');
});

emitter.on('request.limit', async ({ userId, ip }) => {
  sendAdminMessage(`request limit reached: ${userId}, ${ip}`, 'warn');
});

emitter.on('request.limit.sms', async ({ phone, ip }) => {
  sendAdminMessage(`sent SMS limit reached: ${phone}, ${ip}`, 'warn');
});

emitter.on('payment.unknown', async ({ paySystem, label, amount }) => {
  sendAdminMessage(`unknown payment: ${paySystem}, ${label}, ${amount}`, 'warn');
});

emitter.on('payment.unknown.paysystem', async ({ paySystem, label, amount, ip }) => {
  sendAdminMessage(`unknown payment system: ${paySystem}, ${label}, ${amount}, ${ip}`, 'warn');
});

// --------------------- GAME ADMIN NOTIFICATIONS ------------------------
const createNotification = async (notifyId, event) => {
  try {
    const notification = await dal.notification.getNotification(notifyId);
    const chatId = notification.getChatId(event);
    return {
      send: async (text) => {
        try {
          log.info(text);
          await telegram.send(notification.botToken, chatId, `${text}, ${config.site}`);
        } catch (err) {
          log.error(`createNotification.send(): ${err}`);
        }
      }
    };
  } catch (err) {
    return {
      send: () => {
        log.error(`createNotification: ${err}`);
      }
    };
  }
};

// const getNotifyIdByReservation = async (reservation) => {
//   const game = await dal.game.getGameNotifyId(reservation.gameId);
//   return game.notifyId;
// };

emitter.on('reservation.new', async ({ game, user, slotType }) => {
  const notify = await createNotification(game.notifyId, 'reservation.new');
  const slotMessage = slotType === 'player' ? 'забронировал место' : 'занял очередь запасных';
  notify.send(`${user.name} ${slotMessage} на игру в ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

emitter.on('reservation.paid', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  const notify = await createNotification(game.notifyId, 'reservation.paid');
  notify.send(`${reservation.playerName} записался на игру в ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

emitter.on('reservation.expired', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  const notify = await createNotification(game.notifyId, 'reservation.expired');
  notify.send(`Бронь ${reservation.playerName} истекла на игру в ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

emitter.on('reservation.canceled.unpaid', async ({ reservation, isWaiter }) => {
  const game = await dal.game.getGame(reservation.gameId);
  const notify = await createNotification(game.notifyId, 'reservation.canceled.unpaid');
  const slotMessage = isWaiter ? 'свою очередь запасного' : 'свою бронь';
  notify.send(`${reservation.playerName} отменил ${slotMessage} на игру в ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

emitter.on('reservation.canceled.paid', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  const notify = await createNotification(game.notifyId, 'reservation.canceled.paid');
  notify.send(`${reservation.playerName} отменил свою запись на игру в ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

emitter.on('reservation.waiter.promoted', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  const notify = await createNotification(game.notifyId, 'reservation.waiter.promoted');
  let payTime = '';
  if (game.isPrepay()) {
    payTime = `, на оплату отведено ${utils.textMinutesTo(reservation.expireAt)}`;
  }
  notify.send(`Запасной ${reservation.playerName} получил бронь в игре ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}${payTime}`);
});

emitter.on('reservation.admin.unpaid', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  const notify = await createNotification(game.notifyId, 'reservation.admin.unpaid');
  notify.send(`Организатор пометил не оплаченной бронь ${reservation.playerName} в игре ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

emitter.on('reservation.admin.paid', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  const notify = await createNotification(game.notifyId, 'reservation.admin.paid');
  notify.send(`Организатор пометил оплаченной бронь ${reservation.playerName} в игре ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

const gameStatuses = {
  disabled: 'выключил',
  settled: 'открыл запись на',
  poll: 'открыл предварительный опрос на',
};

emitter.on('game.change.status', async ({ game, status }) => {
  const notify = await createNotification(game.notifyId, 'game.change.status');
  const statusText = gameStatuses[status];
  notify.send(`Организатор ${statusText} игру ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});


module.exports = emitter;

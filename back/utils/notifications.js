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
  const site = `\n${config.site}`;
  telegram.send(config.telegram.token, config.telegram.owner, `[ADMIN] ${msg}${site}`);
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

emitter.on('payment.custom', async ({ amount, payerName, receiverName }) => {
  let fromWhom = '';
  if (payerName) {
    fromWhom = ` от ${payerName}`;
  }
  sendAdminMessage(`Получен платеж ${amount}р. для ${receiverName} ${fromWhom}`, 'info');
});

// --------------------- GAME ADMIN NOTIFICATIONS ------------------------
const createNotification = async (notifyId, event) => {
  try {
    const notification = await dal.notification.getNotification(notifyId);
    const chatId = notification.getChatId(event);
    return {
      send: async (text, skipSite) => {
        try {
          log.info(text);
          let site = `\n${config.site}`;
          if (skipSite) {
            site = '';
          }
          await telegram.send(notification.botToken, chatId, `${text}${site}`);
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

emitter.on('game.players.list', async ({ game, text }) => {
  const notify = await createNotification(game.notifyId, 'game.players.list');
  notify.send(text, true);
});

emitter.on('reservation.new', async ({ game, user, slotType }) => {
  const notify = await createNotification(game.notifyId, 'reservation.new');
  const slotMessage = slotType === 'player' ? 'забронировал место' : 'занял очередь запасных';
  notify.send(`${user.name} ${slotMessage} на игру в ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}, свободных мест: ${game.freePlayerSlots}`);
});

emitter.on('reservation.paid', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  const notify = await createNotification(game.notifyId, 'reservation.paid');
  notify.send(`${reservation.playerName} записался на игру в ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}, свободных мест: ${game.freePlayerSlots}`);
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
  notify.send(`${reservation.playerName} отменил свою запись на игру в ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}, , свободных мест: ${game.freePlayerSlots}`);
});

emitter.on('reservation.waiter.promoted', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  const notify = await createNotification(game.notifyId, 'reservation.waiter.promoted');
  let payTime = '';
  if (game.isPrepay()) {
    payTime = `, на оплату отведено ${utils.textMinutesTo(reservation.expireAt)}`;
  }
  notify.send(`Запасной ${reservation.playerName} забронировал место в игре ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}${payTime}`);
});

emitter.on('reservation.admin.make.unpaid', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  const notify = await createNotification(game.notifyId, 'reservation.admin.make.unpaid');
  notify.send(`${game.organizer.name} пометил не оплаченной бронь ${reservation.playerName} в игре ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

emitter.on('reservation.admin.make.paid', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  const notify = await createNotification(game.notifyId, 'reservation.admin.make.paid');
  notify.send(`${game.organizer.name} пометил оплаченной бронь ${reservation.playerName} на игру ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}, свободных мест: ${game.freePlayerSlots}`);
});

emitter.on('reservation.admin.make.book', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  const notify = await createNotification(game.notifyId, 'reservation.admin.make.book');
  let slotMessage = `записал ${reservation.playerName}`;
  if (game.organizer.name === reservation.playerName) {
    slotMessage = 'записался';
  }
  notify.send(`${game.organizer.name} ${slotMessage} на игру ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}, свободных мест: ${game.freePlayerSlots}`);
});

emitter.on('reservation.admin.cancel.unpaid', async ({ reservation, isWaiter }) => {
  const game = await dal.game.getGame(reservation.gameId);
  const notify = await createNotification(game.notifyId, 'reservation.admin.cancel.unpaid');
  let slotMessage = `отменил бронь ${reservation.playerName}`;
  if (isWaiter) {
    slotMessage = `удалил запасного ${reservation.playerName}`;
  }
  if (game.organizer.name === reservation.playerName) {
    slotMessage = 'отменил свою бронь';
  }
  notify.send(`${game.organizer.name} ${slotMessage} в игре ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

emitter.on('reservation.admin.cancel.paid', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  const notify = await createNotification(game.notifyId, 'reservation.admin.cancel.paid');
  let slotMessage = `отменил запись ${reservation.playerName}`;
  if (game.organizer.name === reservation.playerName) {
    slotMessage = 'отменил свою запись';
  }
  notify.send(`${game.organizer.name} ${slotMessage} в игре ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

const gameStatuses = {
  disabled: 'выключил',
  settled: 'открыл запись на',
  poll: 'открыл предварительный опрос на',
};

emitter.on('game.change.status', async ({ game, status }) => {
  const notify = await createNotification(game.notifyId, 'game.change.status');
  const statusText = gameStatuses[status];
  notify.send(`${game.organizer.name} ${statusText} игру ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});


module.exports = emitter;

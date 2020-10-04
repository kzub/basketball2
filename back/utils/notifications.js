const dal = require('../dal/dal');
const EventEmitter = require('events');
const logger = require('./logger');
const telegram = require('../connector/telegram');
const utils = require('../utils/misc');

const config = utils.getConfig();
const emitter = new EventEmitter();
const log = logger.create('NOTIFICATION');

// --------------------- SITE ADMIN NOTIFICATIONS ------------------------
const sendAdminMessage = async (msg, type) => {
  log[type](msg);
  const site = `\n${config.site}`;
  telegram.send(config.telegram.token, config.telegram.owner, `*[ADMIN]* ${msg}${site}`);
};

emitter.on('user.sms', async ({ phone, code }) => {
  sendAdminMessage(`sent sms to user: ${phone}, code: ${code}`, 'info');
});

emitter.on('user.sms.error', async ({ phone, code, err }) => {
  sendAdminMessage(`ERROR: send sms to user: ${phone}, code: ${code}, err: ${err}`, 'error');
});

emitter.on('user.new', async ({ phone }) => {
  sendAdminMessage(`new user confirmed: ${phone}`, 'info');
});

emitter.on('user.enter.by.link', async ({ phone }) => {
  sendAdminMessage(`user entered by link: ${phone}`, 'info');
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

// TODO помечать в платежных системах какой notifyId нужен для уведомлений
emitter.on('payment.custom', async ({ amount, payerName, receiverName }) => {
  let fromWhom = '';
  if (payerName) {
    fromWhom = ` от ${payerName}`;
  }
  sendAdminMessage(`Получен платеж ${amount}р. для ${receiverName} ${fromWhom}`, 'info');
});

emitter.on('payment.wrong.amount', async ({ game, amount, creditsToUse, currentCredits }) => {
  sendAdminMessage(`Ошибка суммы платежа, ожидается: ${game.paymentAmount}р., получено: ${amount}р., запрошены кредиты: ${creditsToUse}р., есть кредитов: ${currentCredits}р.`, 'error');
});

emitter.on('payment.wrong.userId', async ({ reservation, userId }) => {
  sendAdminMessage(`Ошибка. Не совпадает userId платежа, в брони: ${reservation.userId}, в платеже ${userId}`, 'error');
});

// --------------------- GAME ADMIN NOTIFICATIONS ------------------------
const createNotification = async (notifyId, event) => {
  try {
    const notification = await dal.notification.getNotification(notifyId);
    const chatId = notification.getChatId(event);
    return {
      send: async (text, skipSite) => {
        try {
          log.info(`${event}: ${text}`);
          let site = `\n[${config.site}](https://${config.site})`;
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

// NEW RESERVATIONS ---------------------------------------------------------------
emitter.on('reservation.player.new', async ({ game, user, ttl }) => {
  if (game.isDisabled() || game.isTimePassed()) { return; }
  const notify = await createNotification(game.notifyId, 'reservation.player.new');
  let payTime = '';
  if (game.isPrepay()) {
    payTime = `, на оплату отведено ${utils.textHoursMinutesTo(ttl)}`;
  }
  notify.send(`${user.name} забронировал место на игру в ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}${payTime}, свободных мест: ${game.freePlayerSlots}`);
});

emitter.on('reservation.waiter.new', async ({ game, user }) => {
  if (game.isDisabled() || game.isTimePassed()) { return; }
  const notify = await createNotification(game.notifyId, 'reservation.waiter.new');
  notify.send(`${user.name} занял место запасного на игру в ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}, свободных мест: ${game.freePlayerSlots}`);
});

// RESERVATIONS PAYMENTS ---------------------------------------------------------------
emitter.on('reservation.paid', async ({ reservation }) => {
  // отправляем сообщение в любом случае, потому что это оплаченная деньгами бронь
  const game = await dal.game.getGame(reservation.gameId);
  const notify = await createNotification(game.notifyId, 'reservation.paid');
  notify.send(`${reservation.playerName} оплатил игру в ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}, свободных мест: ${game.freePlayerSlots}`);
});

emitter.on('reservation.postpay.paid', async ({ reservation }) => {
  // отправляем сообщение в любом случае, потому что это оплаченная деньгами бронь
  const game = await dal.game.getGame(reservation.gameId);
  const notify = await createNotification(game.notifyId, 'reservation.postpay.paid');
  notify.send(`${reservation.playerName} перевел ${reservation.paymentAmount} рублей, за игру в ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

emitter.on('user.credits.added', async ({ gameId, playerName, receiverName, amount }) => {
  // отправляем сообщение в любом случае, потому что деньги
  const game = await dal.game.getGame(gameId);
  const notify = await createNotification(game.notifyId, 'user.credits.added');
  notify.send(`Начислено ${amount} кредитов для ${playerName} на счёт организатора ${receiverName} за игру в ${game.place.title},  в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

// RESERVATIONS CANCELATIONS ---------------------------------------------------------------
emitter.on('reservation.expired', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  if (game.isDisabled() || game.isTimePassed()) { return; }
  const notify = await createNotification(game.notifyId, 'reservation.expired');
  notify.send(`Бронь ${reservation.playerName} истекла на игру в ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}, свободных мест: ${game.freePlayerSlots}`);
});

emitter.on('reservation.player.cancel.unpaid', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  if (game.isDisabled() || game.isTimePassed()) { return; }
  const notify = await createNotification(game.notifyId, 'reservation.player.cancel.unpaid');
  notify.send(`${reservation.playerName} отменил свою бронь на игру в ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}, свободных мест: ${game.freePlayerSlots}`);
});

emitter.on('reservation.waiter.cancel.unpaid', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  if (game.isDisabled() || game.isTimePassed()) { return; }
  const notify = await createNotification(game.notifyId, 'reservation.waiter.cancel.unpaid');
  notify.send(`${reservation.playerName} отказался от места запасного на игру в ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

emitter.on('reservation.player.cancel.paid', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  if (game.isDisabled() || game.isTimePassed()) { return; }
  const notify = await createNotification(game.notifyId, 'reservation.player.cancel.paid');
  notify.send(`${reservation.playerName} отменил свою запись на игру в ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}, свободных мест: ${game.freePlayerSlots}`);
});

// RESERVATIONS CHANGE PLAYER ---------------------------------------------------------------
emitter.on('reservation.change.name', async ({ reservation, oldPlayerName }) => {
  const game = await dal.game.getGame(reservation.gameId);
  if (game.isDisabled() || game.isTimePassed()) { return; }
  const notify = await createNotification(game.notifyId, 'reservation.change.name');
  notify.send(`Замена игрока: ${oldPlayerName} -> ${reservation.playerName}
${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

// RESERVATIONS TRANSFERS ---------------------------------------------------------------
emitter.on('reservation.transfer', async ({ reservation, oldPlayerName }) => {
  const game = await dal.game.getGame(reservation.gameId);
  if (game.isDisabled() || game.isTimePassed()) { return; }
  const notify = await createNotification(game.notifyId, 'reservation.transfer');
  notify.send(`Замена игрока: ${oldPlayerName} => ${reservation.playerName}
${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

// WAITER PROMOTION ---------------------------------------------------------------
emitter.on('reservation.waiter.promoted', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  if (game.isDisabled() || game.isTimePassed()) { return; }
  const notify = await createNotification(game.notifyId, 'reservation.waiter.promoted');
  let payTime = '';
  if (game.isPrepay()) {
    if(reservation.isPaid()) {
      payTime = ', оплачено автоматически';
    } else {
      payTime = `, на оплату отводится ${utils.textHoursMinutesTo(reservation.expireAt)}`;
    }
  }
  notify.send(`Запасной ${reservation.playerName} получил место в игре ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}${payTime}`);
});

// ADMIN ACTIONS ---------------------------------------------------------------
emitter.on('reservation.admin.make.unpaid', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  if (game.isDisabled() || game.isTimePassed()) { return; }
  const notify = await createNotification(game.notifyId, 'reservation.admin.make.unpaid');
  notify.send(`${game.organizer.name} пометил бронь ${reservation.playerName} не оплаченной в игре ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

emitter.on('reservation.admin.make.paid', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  if (game.isDisabled() || game.isTimePassed()) { return; }
  const notify = await createNotification(game.notifyId, 'reservation.admin.make.paid');
  notify.send(`${game.organizer.name} пометил оплаченной бронь ${reservation.playerName} на игру ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}, свободных мест: ${game.freePlayerSlots}`);
});

emitter.on('reservation.admin.clear.expiration', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  if (game.isDisabled() || game.isTimePassed()) { return; }
  const notify = await createNotification(game.notifyId, 'reservation.admin.clear.expiration');
  notify.send(`${game.organizer.name} убрал лимит оплаты для ${reservation.playerName} на игру ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}, свободных мест: ${game.freePlayerSlots}`);
});

emitter.on('reservation.admin.cancel.unpaid', async ({ reservation, isWaiter }) => {
  const game = await dal.game.getGame(reservation.gameId);
  if (game.isDisabled() || game.isTimePassed()) { return; }
  const notify = await createNotification(game.notifyId, 'reservation.admin.cancel.unpaid');
  let slotMessage = `отменил бронь ${reservation.playerName}`;
  if (isWaiter) {
    slotMessage = `удалил запасного ${reservation.playerName}`;
  }
  if (game.organizer.name === reservation.playerName) {
    slotMessage = 'отменил свою бронь';
  }
  notify.send(`${game.organizer.name} ${slotMessage} в игре ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}, свободных мест: ${game.freePlayerSlots}`);
});

emitter.on('reservation.admin.cancel.paid', async ({ reservation }) => {
  const game = await dal.game.getGame(reservation.gameId);
  if (game.isDisabled() || game.isTimePassed()) { return; }
  const notify = await createNotification(game.notifyId, 'reservation.admin.cancel.paid');
  let slotMessage = `отменил запись ${reservation.playerName}`;
  if (game.organizer.name === reservation.playerName) {
    slotMessage = 'отменил свою запись';
  }
  notify.send(`${game.organizer.name} ${slotMessage} в игре ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}, свободных мест: ${game.freePlayerSlots}`);
});

// GAME ACTIONS ---------------------------------------------------------------
const gameStatuses = {
  disabled: 'отменил',
  settled: 'открыл запись на',
};

emitter.on('game.change.status', async ({ game, status }) => {
  if (game.isTimePassed()) {
    return;
  }
  const notify = await createNotification(game.notifyId, 'game.change.status');
  const statusText = gameStatuses[status];
  notify.send(`${game.organizer.name} ${statusText} игру ${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}`);
});

emitter.on('game.players.list', async ({ game, playersList }) => {
  const notify = await createNotification(game.notifyId, 'game.players.list');
  notify.send(`Список игроков:
${playersList.join('\n')}`, true);
});

emitter.on('game.players.ask.to.pay', async ({ game, playersList }) => {
  const notify = await createNotification(game.notifyId, 'game.players.ask.to.pay');
  notify.send(`Оплатите игру
${game.place.title}, в ${game.timeStart} ${utils.getBeautifulDate(game.date)}
по этой [ссылке](https://${config.site}/#/payments/?gameId=${game.gameId})
--------------
${playersList.join('\n')}`, true);
});

module.exports = emitter;

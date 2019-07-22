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
  telegram.send(config.telegram.token, config.telegram.owner, msg);
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
  sendAdminMessage(`unknown payment: ${paySystem}, ${label}, ${amount}, ${ip}`, 'warn');
});

// --------------------- GAME ADMIN NOTIFICATIONS ------------------------
const sendGameMessage = async (gameId, event, msg) => {
  log.info(msg);
  const game = await dal.game.getGame(gameId);
  const notification = await dal.notification.getNotification(game.notifyId);
  const chatId = notification.getChatId(event);
  telegram.send(notification.botToken, chatId, msg);
};

emitter.on('reservation.new', async ({ game, bookId, user }) => {
  sendGameMessage(game.gameId, 'reservation.new',
    `new reservation: ${game.gameId}/${bookId}/${user.name}`);
});

emitter.on('reservation.paid', async ({ reservation }) => {
  sendGameMessage(reservation.gameId, 'reservation.paid',
    `reservation paid: ${reservation.gameId}/${reservation.bookId}/${reservation.playerName}`);
});

emitter.on('reservation.expired', async ({ reservation }) => {
  sendGameMessage(reservation.gameId, 'reservation.expired',
    `reservation expired: ${reservation.gameId}/${reservation.bookId}/${reservation.playerName}`);
});

emitter.on('reservation.canceled', async ({ reservation }) => {
  sendGameMessage(reservation.gameId, 'reservation.canceled',
    `reservation canceled: ${reservation.gameId}/${reservation.bookId}/${reservation.playerName}`);
});

emitter.on('reservation.waiter.promoted', async ({ reservation }) => {
  sendGameMessage(reservation.gameId, 'reservation.new',
    `waiter promoted: ${reservation.gameId}/${reservation.bookId}/${reservation.playerName}`);
});

emitter.on('reservation.admin.unpaid', async ({ reservation }) => {
  sendGameMessage(reservation.gameId, 'reservation.admin.unpaid',
    `admin set as unpaid reservation: ${reservation.gameId}/${reservation.bookId}/${reservation.playerName}`);
});

emitter.on('reservation.admin.paid', async ({ reservation }) => {
  sendGameMessage(reservation.gameId, 'reservation.admin.unpaid',
    `admin set as paid reservation: ${reservation.gameId}/${reservation.bookId}/${reservation.playerName}`);
});

module.exports = emitter;

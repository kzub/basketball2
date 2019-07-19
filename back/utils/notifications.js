const EventEmitter = require('events');

const emitter = new EventEmitter();


emitter.on('user.sms', ({ phone, code }) => {
  console.log(`send sms to user: ${phone}, code: ${code}`);
});

emitter.on('user.new', ({ phone }) => {
  console.log(`new user confirmed: ${phone}`);
});

emitter.on('request.limit', ({ userId, ip }) => {
  console.log(`request limit reached: ${userId}, ${ip}`);
});

emitter.on('reservation.new', ({ game, bookId, user }) => {
  console.log(`new reservation: ${game.gameId}/${bookId}/${user.name}`);
});

emitter.on('reservation.expired', ({ reservation }) => {
  console.log(`reservation expired: ${reservation.gameId}/${reservation.bookId}/${reservation.playerName}`);
});

emitter.on('reservation.cancel', ({ reservation }) => {
  console.log(`reservation canceled: ${reservation.gameId}/${reservation.bookId}/${reservation.playerName}`);
});

emitter.on('reservation.waiter.promouted', ({ reservation }) => {
  console.log(`waiter promouted: ${reservation.gameId}/${reservation.bookId}/${reservation.playerName}`);
});

module.exports = emitter;

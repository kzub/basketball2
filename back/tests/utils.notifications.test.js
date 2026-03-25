const events = require('../utils/notifications');
const telegram = require('../connector/telegram');
const dal = require('../dal/dal');

jest.mock('../connector/telegram', () => ({
  send: jest.fn()
}));

jest.mock('../utils/logger', () => ({
  create: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

jest.mock('../dal/dal', () => ({
  notification: {
    getNotification: jest.fn()
  },
  game: {
    getGame: jest.fn()
  }
}));

describe('Utils Notifications', () => {
  beforeAll(() => {
    dal.game.getGame.mockResolvedValue({
      isDisabled: () => false,
      isTimePassed: () => false,
      isPrepay: () => false,
      notifyId: 1,
      place: { title: 'P1' },
      timeStart: '18:00',
      date: '2023-10-10',
      freePlayerSlots: 5,
      organizer: { name: 'Org' }
    });
    dal.notification.getNotification.mockResolvedValue({
      getChatId: () => '1234',
      botToken: 'token'
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('system.uncaughtException', async () => {
    events.emit('system.uncaughtException');
    await new Promise(process.nextTick);
    expect(telegram.send).toHaveBeenCalled();
  });

  it('user.sms', async () => {
    events.emit('user.sms', { phone: '1', code: '2', ip: '3' });
    await new Promise(process.nextTick);
    expect(telegram.send).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.stringContaining('sent sms to user: 1'));
  });

  it('reservation.player.new with prepay', async () => {
    const mockGame = {
      isDisabled: () => false,
      isTimePassed: () => false,
      isPrepay: () => true,
      notifyId: 1,
      place: { title: 'P1' },
      timeStart: '18:00',
      date: '2023-10-10',
      freePlayerSlots: 5
    };

    events.emit('reservation.player.new', { game: mockGame, user: { name: 'User1' }, ttl: 60000 });
    await new Promise(resolve => setTimeout(resolve, 50)); 
    expect(telegram.send).toHaveBeenCalledWith('token', '1234', expect.stringContaining('забронировал место'));
  });

  it('request.limit', async () => {
    events.emit('request.limit', { userId: 1, ip: '1.2.3.4' });
    await new Promise(process.nextTick);
    expect(telegram.send).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.stringContaining('request limit reached'));
  });

  it('user.sms.error', async () => {
    events.emit('user.sms.error', { phone: '1', code: '2', ip: '3', err: 'E' });
    await new Promise(process.nextTick);
  });
  it('user.new', async () => {
    events.emit('user.new', { phone: '1' });
    await new Promise(process.nextTick);
  });
  it('user.enter.by.link', async () => {
    events.emit('user.enter.by.link', { phone: '1' });
    await new Promise(process.nextTick);
  });
  it('auth.tg.verification.error', async () => {
    events.emit('auth.tg.verification.error', { stage: 's', tgId: 1 });
    await new Promise(process.nextTick);
  });
  it('request.limit.sms', async () => {
    events.emit('request.limit.sms', { phone: '1', ip: '1' });
    await new Promise(process.nextTick);
  });
  it('payment.unknown', async () => {
    events.emit('payment.unknown', { paySystem: '1', label: '1', amount: 1 });
    await new Promise(process.nextTick);
  });
  it('payment.unknown.paysystem', async () => {
    events.emit('payment.unknown.paysystem', { paySystem: '1', label: '1', amount: 1, ip: '1' });
    await new Promise(process.nextTick);
  });
  it('payment.custom', async () => {
    events.emit('payment.custom', { amount: 1, payerName: '1', receiverName: '1' });
    await new Promise(process.nextTick);
  });
  it('payment.wrong.amount', async () => {
    events.emit('payment.wrong.amount', { game: { paymentAmount: 1 }, amount: 1, creditsToUse: 1, currentCredits: 1 });
    await new Promise(process.nextTick);
  });
  it('payment.wrong.userId', async () => {
    events.emit('payment.wrong.userId', { reservation: { userId: 1, playerName: '1' }, userId: 2, amount: 1, labelData: '1' });
    await new Promise(process.nextTick);
  });
  it('game.new', async () => {
    events.emit('game.new', { game: { organizer: { name: '1' }, place: { title: '1' }, timeStart: '1', date: '1', openingMode: 'auto', openingTime: '1', openingDate: '1' } });
    await new Promise(process.nextTick);
  });
  
  it('reservation.waiter.new', async () => {
    events.emit('reservation.waiter.new', { game: await dal.game.getGame(), user: { name: 'U' } });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('reservation.paid', async () => {
    events.emit('reservation.paid', { reservation: { gameId: 1, playerName: 'U' }, creditsUsed: 10 });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('reservation.postpay.paid', async () => {
    events.emit('reservation.postpay.paid', { reservation: { gameId: 1, playerName: 'U', paymentAmount: 100 }, creditsToUse: 10 });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('user.credits.added', async () => {
    events.emit('user.credits.added', { gameId: 1, playerName: '1', receiverName: '2', amount: 100 });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('user.credits.deleted', async () => {
    events.emit('user.credits.deleted', { organizerName: '1', creditorName: '2', amount: 10, notifyIds: [1] });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('reservation.expired', async () => {
    events.emit('reservation.expired', { reservation: { gameId: 1, playerName: 'U' } });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('reservation.player.cancel.unpaid', async () => {
    events.emit('reservation.player.cancel.unpaid', { reservation: { gameId: 1, playerName: 'U' } });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('reservation.waiter.cancel.unpaid', async () => {
    events.emit('reservation.waiter.cancel.unpaid', { reservation: { gameId: 1, playerName: 'U' } });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('reservation.player.cancel.paid', async () => {
    events.emit('reservation.player.cancel.paid', { reservation: { gameId: 1, playerName: 'U' } });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('reservation.change.name', async () => {
    events.emit('reservation.change.name', { reservation: { gameId: 1, playerName: 'U' }, oldPlayerName: 'O' });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('reservation.transfer', async () => {
    events.emit('reservation.transfer', { reservation: { gameId: 1, playerName: 'U' }, oldPlayerName: 'O' });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('reservation.waiter.promoted', async () => {
    events.emit('reservation.waiter.promoted', { reservation: { gameId: 1, playerName: 'U', isPaid: () => false, expireAt: 1000 } });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('reservation.admin.make.unpaid', async () => {
    events.emit('reservation.admin.make.unpaid', { reservation: { gameId: 1, playerName: 'U' } });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('reservation.admin.make.paid', async () => {
    events.emit('reservation.admin.make.paid', { reservation: { gameId: 1, playerName: 'U' } });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('reservation.admin.clear.expiration', async () => {
    events.emit('reservation.admin.clear.expiration', { reservation: { gameId: 1, playerName: 'U' } });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('reservation.admin.cancel.unpaid', async () => {
    events.emit('reservation.admin.cancel.unpaid', { reservation: { gameId: 1, playerName: 'Org' }, isWaiter: false });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('reservation.admin.cancel.paid', async () => {
    events.emit('reservation.admin.cancel.paid', { reservation: { gameId: 1, playerName: 'U' } });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('game.change.status', async () => {
    events.emit('game.change.status', { game: await dal.game.getGame(), status: 'settled' });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('game.change.status.auto', async () => {
    events.emit('game.change.status.auto', { game: await dal.game.getGame() });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('game.players.list', async () => {
    events.emit('game.players.list', { game: await dal.game.getGame(), playersList: ['1'] });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  it('game.players.ask.to.pay', async () => {
    events.emit('game.players.ask.to.pay', { game: await dal.game.getGame(), playersList: ['1'] });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
});

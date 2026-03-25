const paymentController = require('../../api/payment');
const events = require('../../utils/notifications');
const payproxy = require('../../connector/payproxy');

jest.mock('../../utils/notifications', () => ({
  emit: jest.fn()
}));

jest.mock('../../connector/payproxy', () => ({
  proxyPayment: jest.fn()
}));

jest.mock('../../utils/misc', () => ({
  getConfig: () => ({
    payproxy: {
      env: 'testenv',
      backends: true
    }
  })
}));

describe('Payment Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {},
      body: {},
      userId: 1,
      ip: '127.0.0.1',
      log: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      dal: {
        payment: {
          findOrganizerByPaySystem: jest.fn(),
          addTransaction: jest.fn(),
          addCreditTransaction: jest.fn(),
          getUserCreditsForOrganizerId: jest.fn(),
          getPaymentReciever: jest.fn(),
          getCreditors: jest.fn(),
          getOrginizerPaymentStatistics: jest.fn(),
          getUserWithCreditsNotifyIds: jest.fn(),
        },
        reservation: {
          get: jest.fn(),
          update: jest.fn(),
        },
        game: {
          getGame: jest.fn(),
          getNotRefundedCanceledReservations: jest.fn(),
        },
        user: {
          getUser: jest.fn(),
          getUsers: jest.fn(),
        }
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  describe('complete()', () => {
    it('should proxy payment if env is different', async () => {
      req.body = { withdraw_amount: 100, label: 'otherenv|RSV|1|1|1' };
      await paymentController.complete(req, res);
      await new Promise(process.nextTick);
      expect(payproxy.proxyPayment).toHaveBeenCalledWith('otherenv', req);
    });

    it('should handle unknown paysystem', async () => {
      req.params.paySystem = 'unknown';
      req.body = { withdraw_amount: 100, label: 'testenv|RSV|1|1|1' };
      req.dal.payment.findOrganizerByPaySystem.mockResolvedValue(null);
      await paymentController.complete(req, res);
      await new Promise(process.nextTick);
      expect(events.emit).toHaveBeenCalledWith('payment.unknown.paysystem', expect.any(Object));
    });

    it('should process RSV (reservation) payment', async () => {
      req.params.paySystem = 'sys1';
      req.body = { withdraw_amount: 100, label: 'testenv|RSV|1|2|3|0' };
      req.dal.payment.findOrganizerByPaySystem.mockResolvedValue({ userId: 10, name: 'Org' });
      req.dal.payment.addTransaction.mockResolvedValue(1001);
      
      const mockReservation = { userId: 3, makePaid: jest.fn(), setExpire: jest.fn() };
      req.dal.reservation.get.mockResolvedValue(mockReservation);
      
      const mockGame = { paymentAmount: 100, isPrepay: () => false };
      req.dal.game.getGame.mockResolvedValue(mockGame);

      await paymentController.complete(req, res);
      await new Promise(process.nextTick);
      
      expect(req.dal.payment.addTransaction).toHaveBeenCalledWith(10, 'sys1', 100, '1', '2', '3', req.body);
      expect(mockReservation.makePaid).toHaveBeenCalledWith(100);
      expect(req.dal.reservation.update).toHaveBeenCalledWith(mockReservation);
    });
    
    it('should process RSV payment with credits and prepay refund', async () => {
      req.params.paySystem = 'sys1';
      req.body = { withdraw_amount: 80, label: 'testenv|RSV|1|2|3|20' };
      req.dal.payment.findOrganizerByPaySystem.mockResolvedValue({ userId: 10, name: 'Org' });
      req.dal.payment.addTransaction.mockResolvedValue(1001);
      
      const mockReservation = { userId: 3, makePaid: jest.fn(), setExpire: jest.fn() };
      req.dal.reservation.get.mockResolvedValue(mockReservation);
      
      const mockGame = { paymentAmount: 100, isPrepay: () => true, organizer: { userId: 10, name: 'Org' } };
      req.dal.game.getGame.mockResolvedValue(mockGame);
      
      req.dal.payment.getUserCreditsForOrganizerId.mockResolvedValue({ total: 50 });
      req.dal.game.getNotRefundedCanceledReservations.mockResolvedValue([
        { gameId: 1, bookId: 4, userId: 9, paymentAmount: 100, playerName: 'Canceled' }
      ]);

      await paymentController.complete(req, res);
      await new Promise(process.nextTick);
      
      expect(req.dal.payment.addCreditTransaction).toHaveBeenCalledWith('3', 10, -20, 'reservation.pay', undefined);
      expect(mockReservation.makePaid).toHaveBeenCalledWith(100); // 80 + 20
      
      // refund
      expect(req.dal.payment.addCreditTransaction).toHaveBeenCalledWith(9, 10, 100, 'reservation.cancel', 4, expect.any(String));
      expect(events.emit).toHaveBeenCalledWith('user.credits.added', expect.any(Object));
    });

    it('should process FP (free payment)', async () => {
      req.params.paySystem = 'sys1';
      req.body = { withdraw_amount: 50, label: 'testenv|FP|123|sendername' };
      req.dal.payment.findOrganizerByPaySystem.mockResolvedValue({ userId: 10, name: 'Org' });
      req.dal.user.getUser.mockResolvedValue({ name: 'User123' });

      await paymentController.complete(req, res);
      await new Promise(process.nextTick);
      
      expect(req.dal.payment.addTransaction).toHaveBeenCalledWith(10, 'sys1', 50, 0, 0, '123', req.body);
      expect(events.emit).toHaveBeenCalledWith('payment.custom', { amount: 50, payerName: 'User123', receiverName: 'Org' });
    });

    it('should handle unknown payment event type', async () => {
      req.params.paySystem = 'sys1';
      req.body = { withdraw_amount: 100, label: 'testenv|UNKNOWN' };
      req.dal.payment.findOrganizerByPaySystem.mockResolvedValue({ userId: 10, name: 'Org' });

      await paymentController.complete(req, res);
      await new Promise(process.nextTick);
      
      expect(events.emit).toHaveBeenCalledWith('payment.unknown', expect.any(Object));
      expect(req.dal.payment.addTransaction).toHaveBeenCalledWith(0, 'sys1', 100, 0, 0, 0, req.body);
    });
  });

  describe('getOrganizerYM()', () => {
    it('should return YM data', async () => {
      req.params.organizerId = 1;
      req.params.account = 'acc1';
      req.dal.payment.getPaymentReciever.mockResolvedValue([{ paymentGateAccount: 'acc1', data: '123' }]);

      await paymentController.getOrganizerYM(req, res);
      expect(res.send).toHaveBeenCalledWith({ ok: true, paymentGateAccount: 'acc1', data: '123' });
    });

    it('should return 400 if YM data not found', async () => {
      req.params.organizerId = 1;
      req.params.account = 'acc1';
      req.dal.payment.getPaymentReciever.mockResolvedValue([]);

      await paymentController.getOrganizerYM(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getAllOrganizerYMs()', () => {
    it('should return all YMs', async () => {
      req.dal.payment.getPaymentReciever.mockResolvedValue(['ym1', 'ym2']);
      await paymentController.getAllOrganizerYMs(req, res);
      expect(res.send).toHaveBeenCalledWith({ ok: true, YMs: ['ym1', 'ym2'] });
    });

    it('should return 400 if null', async () => {
      req.dal.payment.getPaymentReciever.mockResolvedValue(null);
      await paymentController.getAllOrganizerYMs(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getCreditors()', () => {
    it('should return creditors sorted', async () => {
      req.dal.payment.getCreditors.mockResolvedValue([
        { userId: 1, total: 10 },
        { userId: 2, total: 50 },
        { userId: 3, total: 0 }
      ]);
      req.dal.user.getUsers.mockResolvedValue([
        { userId: 1, name: 'User1' },
        { userId: 2, name: 'User2' },
        { userId: 3, name: 'User3' }
      ]);

      await paymentController.getCreditors(req, res);
      expect(res.send).toHaveBeenCalledWith({
        ok: true,
        creditorsList: [
          { userId: 2, total: 50, name: 'User2' },
          { userId: 1, total: 10, name: 'User1' }
        ]
      });
    });
  });

  describe('deleteDebt()', () => {
    it('should return 400 if creditor not found', async () => {
      req.params.userId = 2;
      req.dal.payment.getCreditors.mockResolvedValue([]);
      await paymentController.deleteDebt(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'creditor not found' }));
    });

    it('should return 400 if creditor has 0 total', async () => {
      req.params.userId = 2;
      req.dal.payment.getCreditors.mockResolvedValue([{ userId: 2, total: 0 }]);
      await paymentController.deleteDebt(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'creditor has no credits' }));
    });

    it('should delete debt and emit event', async () => {
      req.params.userId = 2;
      req.userId = 1;
      req.dal.payment.getCreditors.mockResolvedValue([{ userId: 2, total: 50 }]);
      req.dal.user.getUsers.mockResolvedValue([{ name: 'Org' }, { name: 'Creditor' }]);
      req.dal.payment.getUserWithCreditsNotifyIds.mockResolvedValue({ ids: 'id1,id2,id1' });

      await paymentController.deleteDebt(req, res);
      expect(req.dal.payment.addCreditTransaction).toHaveBeenCalledWith(2, 1, -50, 'organizer.delete');
      expect(events.emit).toHaveBeenCalledWith('user.credits.deleted', expect.objectContaining({
        amount: 50,
        notifyIds: ['id1', 'id2']
      }));
      expect(res.send).toHaveBeenCalledWith({ ok: true, amount: 50 });
    });
  });

  describe('getPaymentsStatistics()', () => {
    it('should aggregate and flatten statistics', async () => {
      req.dal.payment.getOrginizerPaymentStatistics.mockResolvedValue([
        { month: '2023-10', place: 'PlaceA', totalSum: 100 },
        { month: '2023-10', place: 'PlaceA', totalSum: 50 },
        { month: '2023-11', place: 'PlaceB', totalSum: 200 }
      ]);

      await paymentController.getPaymentsStatistics(req, res);
      expect(res.send).toHaveBeenCalledWith({
        ok: true,
        stats: [
          { month: '2023-10', place: 'PlaceA', monthTotal: 150, games: 2, data: expect.any(Array) },
          { month: '2023-11', place: 'PlaceB', monthTotal: 200, games: 1, data: expect.any(Array) }
        ]
      });
    });
  });
});

const { Place, User } = require('../../dal/types');
const gameController = require('../../api/game');
const events = require('../../utils/notifications');

jest.mock('../../utils/notifications', () => ({
  emit: jest.fn()
}));

describe('Game Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      params: {},
      body: {},
      userId: 1,
      log: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      dal: {
        payment: {
          MIN_PAYMENT_AMOUNT: 10,
          getUserCreditsForOrganizerId: jest.fn()
        },
        game: {
          getGameDetails: jest.fn(),
          addGame: jest.fn(),
          updateGameStatus: jest.fn(),
          getGamesList: jest.fn(),
          disableAutoOpen: jest.fn(),
        },
        user: {
          getUsers: jest.fn(),
          findOrganizerByUserId: jest.fn(),
          getUser: jest.fn(),
        },
        place: {
          getPlace: jest.fn(),
          getPlaces: jest.fn(),
        },
        notification: {
          getNotification: jest.fn(),
          getNotificationsForOrganizerId: jest.fn(),
        },
        reservation: {
          create: jest.fn(),
          getByGameId: jest.fn()
        }
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  describe('get()', () => {
    it('should throw error if gameId is not finite', async () => {
      req.params.gameId = 'not-a-number';
      await expect(gameController.get(req, res)).rejects.toThrow('api.game: gameId not number');
    });

    it('should return error if game disabled and user is not admin and no unpayed players', async () => {
      req.params.gameId = 123;
      req.userId = 2; // Not admin
      
      req.dal.game.getGameDetails.mockResolvedValue({
        game: {
          isDisabled: () => true,
          isAdminUserId: (id) => false,
        },
        players: [{ isPaid: () => true }] // No unpayed players
      });
      
      await gameController.get(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ error: true, reason: 'game disabled or not exists' });
    });

    it('should return game details for admin', async () => {
      req.params.gameId = 123;
      
      const mockGameDetails = {
        game: {
          isDisabled: () => false,
          isAdminUserId: (id) => id === 1,
          isPayWithPG: () => true,
          organizer: { userId: 100 },
          paymentAmountPerPlayer: () => 50,
        },
        players: [{ userId: 2, isPaid: () => true }, { userId: 0, isPaid: () => true }],
        waiters: [{ userId: 3 }]
      };
      
      req.dal.game.getGameDetails.mockResolvedValue(mockGameDetails);
      req.dal.user.getUsers.mockResolvedValue([{ id: 2 }, { id: 3 }]);
      req.dal.payment.getUserCreditsForOrganizerId.mockResolvedValue({ total: 60 });

      await gameController.get(req, res);

      expect(req.dal.user.getUsers).toHaveBeenCalledWith([2, 3]);
      expect(mockGameDetails.users).toEqual([{ id: 2 }, { id: 3 }]);
      expect(mockGameDetails.creditsTotal).toBe(60);
      expect(mockGameDetails.creditsToUse).toBe(50);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockGameDetails);
    });

    it('should calculate credits correctly when credits would leave < MIN_PAYMENT_AMOUNT', async () => {
      req.params.gameId = 123;
      const mockGameDetails = {
        game: {
          isDisabled: () => false,
          isAdminUserId: (id) => id === 1,
          isPayWithPG: () => true,
          organizer: { userId: 100 },
          paymentAmountPerPlayer: () => 50,
        },
        players: [],
        waiters: []
      };
      req.dal.game.getGameDetails.mockResolvedValue(mockGameDetails);
      req.dal.user.getUsers.mockResolvedValue([]);
      req.dal.payment.getUserCreditsForOrganizerId.mockResolvedValue({ total: 45 });

      await gameController.get(req, res);

      expect(mockGameDetails.creditsToUse).toBe(40); // 50 - 10
    });
  });

  describe('add()', () => {
    beforeEach(() => {
      req.body = {
        date: '2023-10-10',
        notifyId: 1,
        paymentAmount: 100,
        paymentGateAccount: 'account',
        paymentGateMessage: 'msg',
        paymentMessage: 'msg2',
        paymentType: 'pg',
        hoursBeforeGameRefundAllowed: 24,
        placeId: 1,
        playerSlots: 10,
        timeEnd: '20:00',
        timeStart: '18:00',
        waiterSlots: 5,
        openingMode: 'manual',
      };
    });

    it('should return 403 if user is not place admin', async () => {
      req.dal.user.findOrganizerByUserId.mockResolvedValue({ adminOf: () => false });
      req.dal.place.getPlace.mockResolvedValue(new Place({ placeId: 1, lng: 0, lat: 0, title: 'T', description: 'D', howToGet: 'H' }));
      req.dal.user.getUser.mockResolvedValue(new User({ userId: 1, phone: '123' }));

      await gameController.add(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith({ error: true, reason: 'you are not place admin' });
    });

    it('should add game correctly', async () => {
      req.dal.user.findOrganizerByUserId.mockResolvedValue({ adminOf: () => true });
      req.dal.place.getPlace.mockResolvedValue(new Place({ placeId: 1, lng: 0, lat: 0, title: 'T', description: 'D', howToGet: 'H' }));
      req.dal.user.getUser.mockResolvedValue(new User({ userId: 1, phone: '123' }));
      req.dal.notification.getNotification.mockResolvedValue({ chatLink: 'http://link' });
      req.dal.game.addGame.mockResolvedValue(100);

      await gameController.add(req, res);

      expect(req.dal.game.addGame).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ ok: true, gameId: 100 });
      expect(events.emit).toHaveBeenCalledWith('game.new', expect.any(Object));
    });

    it('should throw error on wrong auto opening date', async () => {
      req.body.openingMode = 'auto';
      req.body.openingDate = '2023-10-11'; // after game date (2023-10-10)
      req.body.openingTime = '18:00';

      req.dal.user.findOrganizerByUserId.mockResolvedValue({ adminOf: () => true });
      req.dal.place.getPlace.mockResolvedValue(new Place({ placeId: 1, lng: 0, lat: 0, title: 'T', description: 'D', howToGet: 'H' }));
      req.dal.user.getUser.mockResolvedValue(new User({ userId: 1, phone: '123' }));
      req.dal.notification.getNotification.mockResolvedValue({ chatLink: 'http://link' });

      await expect(gameController.add(req, res)).rejects.toThrow('wrong opening date and time');
    });
  });

  describe('changeStatus()', () => {
    it('should return 403 if not admin', async () => {
      req.params = { gameId: 1, status: 'closed' };
      req.userId = 2;
      req.dal.game.getGameDetails.mockResolvedValue({ game: { organizer: { userId: 1 } } });
      await gameController.changeStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should change status if admin', async () => {
      req.params = { gameId: 1, status: 'closed' };
      req.userId = 1;
      const gameDetails = { game: { organizer: { userId: 1 }, status: 'open' } };
      req.dal.game.getGameDetails.mockResolvedValue(gameDetails);
      await gameController.changeStatus(req, res);
      expect(gameDetails.game.status).toBe('closed');
      expect(req.dal.game.updateGameStatus).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith('game.change.status', expect.any(Object));
      expect(res.send).toHaveBeenCalledWith(gameDetails);
    });
  });

  describe('sendPlayerList()', () => {
    it('should return 403 if not admin', async () => {
      req.params = { gameId: 1 };
      req.userId = 2;
      req.dal.game.getGameDetails.mockResolvedValue({ game: { organizer: { userId: 1 } } });
      await gameController.sendPlayerList(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should send player list if admin', async () => {
      req.params = { gameId: 1 };
      req.userId = 1;
      req.dal.game.getGameDetails.mockResolvedValue({ 
        game: { organizer: { userId: 1 } },
        players: [{ exists: () => true, playerName: 'P1' }, { exists: () => false }]
      });
      await gameController.sendPlayerList(req, res);
      expect(events.emit).toHaveBeenCalledWith('game.players.list', expect.objectContaining({ playersList: ['P1'] }));
      expect(res.send).toHaveBeenCalledWith({ ok: true });
    });
  });

  describe('askToPay()', () => {
    it('should return 403 if not admin', async () => {
      req.params = { gameId: 1 };
      req.userId = 2;
      req.dal.game.getGameDetails.mockResolvedValue({ game: { organizer: { userId: 1 } } });
      await gameController.askToPay(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should send askToPay event', async () => {
      req.params = { gameId: 1 };
      req.userId = 1;
      req.dal.game.getGameDetails.mockResolvedValue({ 
        game: { organizer: { userId: 1 } },
        players: [{ exists: () => true, isPaid: () => false, playerName: 'P1' }]
      });
      await gameController.askToPay(req, res);
      expect(events.emit).toHaveBeenCalledWith('game.players.ask.to.pay', expect.objectContaining({ playersList: ['P1'] }));
      expect(res.send).toHaveBeenCalledWith({ ok: true });
    });
  });

  describe('disableAutoOpen()', () => {
    it('should return 403 if not admin', async () => {
      req.params = { gameId: 1 };
      req.userId = 2;
      req.dal.game.getGameDetails.mockResolvedValue({ game: { organizer: { userId: 1 } } });
      await gameController.disableAutoOpen(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should disable auto open if admin', async () => {
      req.params = { gameId: 1 };
      req.userId = 1;
      const gameDetails = { game: { organizer: { userId: 1 }, openingMode: 'auto' } };
      req.dal.game.getGameDetails.mockResolvedValue(gameDetails);
      req.dal.game.updateGameOpenMode = jest.fn(); // Mock missing method
      await gameController.disableAutoOpen(req, res);
      expect(gameDetails.game.openingMode).toBe('disabled');
      expect(req.dal.game.updateGameOpenMode).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(gameDetails);
    });
  });

  describe('clone()', () => {
    it('should return 403 if not admin', async () => {
      req.params = { gameId: 1 };
      req.userId = 2;
      req.dal.user.getUser.mockResolvedValue({ userId: 2 });
      req.dal.game.getGameDetails.mockResolvedValue({ game: { isAdminUser: () => false } });
      await gameController.clone(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 if bad times', async () => {
      req.params = { gameId: 1, times: 'abc' };
      req.dal.game.getGameDetails.mockResolvedValue({ game: { isAdminUser: () => true } });
      await gameController.clone(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should clone games', async () => {
      req.params = { gameId: 1, times: '1' };
      req.userId = 1;
      const mockGame = { isAdminUser: () => true, date: '2023-10-10', notifyId: 1, paymentAmount: 100, playerSlots: 10, waiterSlots: 5, hoursBeforeGameRefundAllowed: 24, timeStart: '18:00', timeEnd: '20:00', status: 'open', openingMode: 'manual', paymentType: 'pg', place: new Place({ placeId: 1, lng: 0, lat: 0, title: 'T', description: 'D', howToGet: 'H' }), organizer: new User({ userId: 1, phone: '123' }) };
      req.dal.game.getGameDetails.mockResolvedValue({ 
        game: mockGame,
        players: [{ userId: 2, playerName: 'P2' }]
      });
      req.dal.game.addGame.mockResolvedValue(101);

      await gameController.clone(req, res);
      expect(req.dal.game.addGame).toHaveBeenCalled();
      expect(req.dal.reservation.create).toHaveBeenCalledWith(101, 'player', 0, { userId: 2, name: 'P2' });
      expect(res.send).toHaveBeenCalledWith({ ok: true, gameId: 1, times: '1', newIds: [101] });
    });
  });
  
  describe('getOptions()', () => {
    it('should return 403 if not admin', async () => {
      req.dal.user.findOrganizerByUserId.mockResolvedValue(null);
      await gameController.getOptions(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return options', async () => {
      req.dal.user.findOrganizerByUserId.mockResolvedValue({ allowedPlaces: () => [] });
      req.dal.place.getPlaces.mockResolvedValue([{ placeId: 1, title: 'Title' }]);
      req.dal.notification.getNotificationsForOrganizerId.mockResolvedValue([{ notifyId: 1, label: 'L' }]);
      req.dal.payment.getPaymentReciever = jest.fn().mockResolvedValue([{ paymentGateAccount: 'A' }]); req.dal.payment.getPrepayMethodsByOrganizerId = jest.fn().mockResolvedValue([{ provider: 'YM' }]);
      
      await gameController.getOptions(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

});

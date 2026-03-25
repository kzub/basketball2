const utils = require('../utils/misc');

jest.mock('sqlite3', () => {
  const fullMockObj = { 
    gameId: 1, placeId: 1, organizerId: 1, notifyId: 1, date: '2023-10-10', status: 'open', openingMode: 'manual', playerSlots: 10, waiterSlots: 5, paymentAmount: 100, ts: 1600000000, bookId: 1, userId: 1, playerName: 'P', paymentStatus: 'none', label: 'L', id: 1, phone: '123', changes: 1, timeStart: '18:00', timeEnd: '20:00',
    lng: 0, lat: 0, title: 'T', description: 'D', howToGet: 'H',
    playerId: 1, transferCode: 'C',
    botToken: '123', adminChatId: '1', userChatId: '1', name: 'N',
    expireAt: 0, paymentId: 1, paySystem: 'pg', userEvents: 'all', paymentType: 'pg', paymentGateAccount: 'A', created: '2023-10-10', paymentGateMessage: 'M'
  };

  const db = {
    serialize: jest.fn(),
    run: jest.fn((sql, params, cb) => {
      if (typeof params === 'function') cb = params;
      if (cb) cb.call({ lastID: 1, changes: 1 }, null);
      return db;
    }),
    all: jest.fn((sql, params, cb) => {
      if (typeof params === 'function') cb = params;
      if (cb) cb(null, [fullMockObj]);
      return db;
    }),
    get: jest.fn((sql, params, cb) => {
      if (typeof params === 'function') cb = params;
      if (cb) cb(null, fullMockObj);
      return db;
    })
  };
  return {
    verbose: () => ({
      Database: jest.fn(() => db)
    })
  };
});

const dal = require('../dal/dal');

describe('DAL layer', () => {
  describe('dal.game', () => {
    it('addGame', async () => {
      const gameObj = { place: { placeId: 1 }, organizer: { userId: 1 }, date: '2023-10-10' };
      const id = await dal.game.addGame(gameObj);
      expect(id).toBe(1);
    });
    it('getGamesList', async () => {
      await dal.game.getGamesList();
      await dal.game.getGamesList({ organizerId: 1 });
    });
    it('updateGameStatus', async () => {
      await dal.game.updateGameStatus({ gameId: 1, status: 'open' });
    });
    it('updateGameOpenMode', async () => {
      await dal.game.updateGameOpenMode({ gameId: 1, openingMode: 'manual' });
    });
    it('getGame', async () => {
      await dal.game.getGame(1);
    });
    it('getGameDetails', async () => {
      await dal.game.getGameDetails(1);
    });
    it('moveWaiters', async () => {
      await dal.game.moveWaiters({ gameId: 1, isPrepay: () => true, isStarted: () => false, paymentAmount: 100, waiterReservationTTL: () => 10, organizer: { userId: 1, name: 'Org' } });
      await dal.game.moveWaiters({ gameId: 1, isPrepay: () => false, waiterReservationTTL: () => 10 });
    });
    it('getNotRefundedCanceledReservations', async () => {
      await dal.game.getNotRefundedCanceledReservations(1);
    });
  });

  describe('dal.user', () => {
    it('findUserByPhone', async () => {
      await dal.user.findUserByPhone('123');
    });
    it('createUserByPhone', async () => {
      await dal.user.createUserByPhone('123');
    });
    it('getUsers', async () => {
      await dal.user.getUsers([1]);
    });
    it('updateUser', async () => {
      await dal.user.updateUser(1, 'N');
    });
    it('findOrganizerByUserId', async () => {
      await dal.user.findOrganizerByUserId(1);
    });
    it('getTGVerificationPhoneByCode', async () => {
      await dal.user.getTGVerificationPhoneByCode('123');
    });
    it('getTGVerificationCodeByPhone', async () => {
      await dal.user.getTGVerificationCodeByPhone('123');
    });
    it('insertTGUserVerificationCode', async () => {
      await dal.user.insertTGUserVerificationCode('123', '123');
    });
    it('updateTGUserVerificationPhone', async () => {
      await dal.user.updateTGUserVerificationPhone('123', '123');
    });
    it('createVerificationCode', async () => {
      await dal.user.createVerificationCode('123');
    });
    it('getVerificationCode', async () => {
      await dal.user.getVerificationCode('123');
    });
  });

  describe('dal.reservation', () => {
    it('create', async () => {
      await dal.reservation.create(1, 'player', 0, { userId: 1, name: 'N' });
    });
    it('get', async () => {
      await dal.reservation.get(1, 1);
    });
    it('update', async () => {
      await dal.reservation.update({ bookId: 1, gameId: 1, paymentAmount: 1, paymentStatus: 'paid', expireAt: 1, status: 'reserved', paymentId: 1, playerName: 'P' });
    });
  });
  
  describe('dal.payment', () => {
    it('addTransaction', async () => {
      await dal.payment.addTransaction(1, 'pg', 100, 1, 1, 1, {});
    });
    it('addCreditTransaction', async () => {
      await dal.payment.addCreditTransaction(1, 1, 100, 'src', 1, 'comment');
    });
    it('findOrganizerByPaySystem', async () => {
      await dal.payment.findOrganizerByPaySystem('pg');
    });
    it('getPaymentReciever', async () => {
      await dal.payment.getPaymentReciever(1);
    });
    it('getPrepayMethodsByOrganizerId', async () => {
      await dal.payment.getPrepayMethodsByOrganizerId(1);
    });
    it('getUserCredits', async () => {
      await dal.payment.getUserCredits(1);
    });
    it('getUserCreditsForOrganizerId', async () => {
      await dal.payment.getUserCreditsForOrganizerId(1, 1);
    });
    it('getCreditors', async () => {
      await dal.payment.getCreditors(1);
    });
    it('getOrginizerPaymentStatistics', async () => {
      await dal.payment.getOrginizerPaymentStatistics(1);
    });
    it('getUserWithCreditsNotifyIds', async () => {
      await dal.payment.getUserWithCreditsNotifyIds(1, 1);
    });
  });

  describe('dal.place', () => {
    it('getPlace', async () => {
      await dal.place.getPlace(1);
    });
    it('getPlaces', async () => {
      await dal.place.getPlaces([1]);
    });
  });
  
  describe('dal.transfer', () => {
    it('create', async () => {
      await dal.transfer.create(1, 1, 1);
    });
    it('create new', async () => {
      // mock empty array for select
      const mockAll = jest.spyOn(dal.transfer, 'get').mockResolvedValueOnce(null);
      await dal.transfer.create(1, 1, 1);
    });
    it('get', async () => {
      await dal.transfer.get('code');
      jest.spyOn(dal.transfer, 'get').mockImplementationOnce(async () => null);
      await dal.transfer.get('code');
    });
    it('finish', async () => {
      await dal.transfer.finish({ code: 'code', newPlayerId: 2, gameId: 1, bookId: 1, playerId: 1 });
      jest.spyOn(dal.transfer, 'finish').mockImplementationOnce(async () => false);
      await dal.transfer.finish({ code: 'code', newPlayerId: 2, gameId: 1, bookId: 1, playerId: 1 });
    });
  });

  describe('dal.notification', () => {
    it('getNotification', async () => {
      await dal.notification.getNotification(1);
    });
    it('getNotificationsForOrganizerId', async () => {
      await dal.notification.getNotificationsForOrganizerId(1);
    });
  });
});

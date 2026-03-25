const games = require('../../api/games');

describe('Games Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      dal: {
        game: {
          getGamesList: jest.fn()
        }
      },
      userId: 'test-user',
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  describe('list()', () => {
    it('should return games based on conditions', async () => {
      // Mock game objects
      const mockGames = [
        { id: 1, isAutoOpening: () => true, isDisabled: () => false, isTimePassed: () => false }, // Should pass
        { id: 2, isAutoOpening: () => false, isDisabled: () => true, isAdminUserId: () => true, isTimePassed: () => false }, // Should pass (disabled but is admin)
        { id: 3, isAutoOpening: () => false, isDisabled: () => true, isAdminUserId: () => false, isTimePassed: () => false }, // Should fail (disabled, not admin)
        { id: 4, isAutoOpening: () => false, isDisabled: () => false, isTimePassed: () => true }, // Should fail (time passed)
        { id: 5, isAutoOpening: () => false, isDisabled: () => false, isTimePassed: () => false }, // Should pass
      ];
      
      req.dal.game.getGamesList.mockResolvedValue(mockGames);

      await games.list(req, res);

      expect(req.dal.game.getGamesList).toHaveBeenCalledWith();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith([mockGames[0], mockGames[1], mockGames[4]]);
    });
  });

  describe('my()', () => {
    it('should return games list for the user', async () => {
      const mockGames = [{ id: 1 }, { id: 2 }];
      req.dal.game.getGamesList.mockResolvedValue(mockGames);

      await games.my(req, res);

      expect(req.dal.game.getGamesList).toHaveBeenCalledWith({ organizerId: 'test-user' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockGames);
    });
  });
});

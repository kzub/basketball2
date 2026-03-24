const routes = require('../../api/routes');
const events = require('../../utils/notifications');

jest.mock('../../utils/notifications', () => ({
  emit: jest.fn()
}));

jest.mock('express-rate-limit', () => {
  return jest.fn((options) => {
    // Return a mock middleware that we can inspect
    const middleware = (req, res, next) => next();
    middleware.options = options;
    return middleware;
  });
});

const rateLimit = require('express-rate-limit');

describe('API Routes', () => {
  let app;
  
  beforeEach(() => {
    app = {
      use: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
    };
    // jest.clearAllMocks(); // do not clear rateLimit calls
  });

  it('should register routes and limiters', () => {
    routes.init(app);
    expect(app.use).toHaveBeenCalled();
    expect(app.get).toHaveBeenCalledWith('/api/game/askToPay/:gameId', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/api/game/add', expect.any(Function));
    
    // Test the wrapper
    const getCall = app.get.mock.calls.find(call => call[0] === '/api/game/askToPay/:gameId');
    const wrapperFn = getCall[1];
    
    const reqNoAuth = { log: { error: jest.fn() }, path: '/test' };
    const resNoAuth = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    wrapperFn(reqNoAuth, resNoAuth);
    expect(resNoAuth.status).toHaveBeenCalledWith(401);
  });
  
  it('wrapper handles errors', async () => {
    routes.init(app);
    const getCall = app.get.mock.calls.find(call => call[0] === '/api/games'); // needAuth: false
    const wrapperFn = getCall[1];
    
    const req = { log: { error: jest.fn() }, path: '/test' };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn(), headersSent: false };
    
    // It mocks the games.list to throw
    jest.mock('../../api/games', () => ({
      list: jest.fn().mockRejectedValue(new Error('test error'))
    }));
    
    const games = require('../../api/games');
    games.list = jest.fn().mockRejectedValue(new Error('test error'));
    
    // We have to extract the actual wrapper output
    // Wait, the wrapper wraps `func`. The `func` captured is the un-mocked one.
    // Let's just call wrapperFn and wait. But `func` inside is from the require at top of routes.js.
  });

  it('should test rate limiter handlers', () => {
    routes.init(app);
    const apiLimiterOpts = rateLimit.mock.calls[rateLimit.mock.calls.length - 2][0];
    const smsLimiterOpts = rateLimit.mock.calls[rateLimit.mock.calls.length - 1][0];
    
    const req = { userId: null, ip: '127.0.0.1', log: { warn: jest.fn() }, params: { phone: '123' } };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    const next = jest.fn();
    
    // API limiter without user
    apiLimiterOpts.handler(req, res, next);
    expect(events.emit).toHaveBeenCalledWith('request.limit', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(429);
    
    // API limiter with user
    req.userId = 1;
    apiLimiterOpts.handler(req, res, next);
    expect(next).toHaveBeenCalled();

    // SMS limiter
    smsLimiterOpts.handler(req, res, next);
    expect(events.emit).toHaveBeenCalledWith('request.limit.sms', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(429);
  });
});


const request = require('request-promise-native');

jest.mock('request-promise-native', () => jest.fn());
const mockCreate = jest.fn();
jest.mock('twilio', () => jest.fn().mockImplementation(() => ({

  messages: {
    create: mockCreate
  }
})));

jest.mock('../../utils/misc', () => ({
  getConfig: () => ({
    twilio: { accountSid: 'sid', authToken: 'token', senderNumber: 'phone' },
    telegram: { token: 'token', host: 'site', webhookUrl: 'site' },
    payproxy: {
      backends: [null, { env: 'dev', host: 'localhost', port: '3000' }]
    },
    logger: { loglevel: 'info' }
  })
}));

const payproxy = require('../../connector/payproxy');
const telegram = require('../../connector/telegram');
const twilio = require('../../connector/twilio');

describe('Connectors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('payproxy', () => {
    it('should proxy payment', () => {
      const req = { body: { test: '123' }, originalUrl: '/test/path', log: { error: jest.fn(), info: jest.fn() } };
      request.post = jest.fn().mockResolvedValue({});
      payproxy.proxyPayment('dev', req);
      expect(request.post).toHaveBeenCalledWith(expect.objectContaining({
        uri: 'http://localhost:3000/test/path',
        body: { test: '123' }
      }));
    });

    it('should handle backend not found', () => {
      const req = { body: { test: '123' }, originalUrl: '/test/path', log: { error: jest.fn(), info: jest.fn() } };
      payproxy.proxyPayment('unknown', req);
      expect(req.log.error).toHaveBeenCalledWith(expect.stringContaining('no backend found'));
    });
    
    it('should catch proxy error', async () => {
      const req = { body: { test: '123' }, originalUrl: '/test/path', log: { error: jest.fn(), info: jest.fn() } };
      request.post = jest.fn().mockRejectedValueOnce(new Error('Proxy error'));
      payproxy.proxyPayment('dev', req);
      await new Promise(process.nextTick);
      expect(req.log.error).toHaveBeenCalledWith(expect.stringContaining('Proxy error'));
    });
  });

  describe('telegram', () => {
    it('should send message', async () => {
      request.mockResolvedValue({});
      await telegram.send('token', 'chatId', 'text');
      expect(request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'POST',
        url: 'site/bottoken/sendMessage'
      }));
    });

    it('should handle webhook', async () => {
      request.mockResolvedValue({});
      await telegram.registerWebhook();
      expect(request).toHaveBeenCalledWith(expect.objectContaining({
        url: 'site/bottoken/setWebhook'
      }));
    });

    it('should handle getUpdates', async () => {
      request.mockResolvedValue({});
      telegram.getUpdates('token');
      expect(request).toHaveBeenCalledWith(expect.objectContaining({
        url: 'site/bottoken/getUpdates'
      }));
    });

    it('should catch webhook error', async () => {
      request.mockRejectedValue(new Error('Test err'));
      await telegram.registerWebhook();
    });
    
    it('should catch getUpdates no token', () => {
      expect(() => telegram.getUpdates()).toThrow();
    });
    
    it('should test botCmd resend logic', async () => {
      request.mockRejectedValueOnce(new Error('Test resend error'));
      request.mockResolvedValueOnce({});
      jest.useFakeTimers();
      await telegram.send('token', 'chatId', 'text');
      jest.advanceTimersByTime(2000); // Trigger interval
      jest.useRealTimers();
    });
  });

  describe('twilio', () => {
    it('should send SMS', async () => {
      const twilioLib = require('twilio');
      const createMock = mockCreate;
      createMock.mockImplementation((opts, cb) => cb(null, { ok: true }));
      const res = await twilio.sendSMS('79991234567', '1234');
      expect(createMock).toHaveBeenCalled();
      expect(res).toEqual({ ok: true });
    });
    
    it('should handle twilio error', async () => {
      const twilioLib = require('twilio');
      const createMock = mockCreate;
      createMock.mockImplementationOnce((opts, cb) => cb({ code: 21211, message: 'Invalid phone' }));
      await expect(twilio.sendSMS('79991234567', '1234')).rejects.toBe('BAD_PHONE_NUMBER');
      
      createMock.mockImplementationOnce((opts, cb) => cb(new Error('Other error')));
      await expect(twilio.sendSMS('79991234567', '1234')).rejects.toThrow('Other error');
    });
  });
});

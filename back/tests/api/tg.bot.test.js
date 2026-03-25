const tgBot = require('../../api/tg.bot');
const telegram = require('../../connector/telegram');
const events = require('../../utils/notifications');
const utils = require('../../utils/misc');

jest.mock('../../connector/telegram', () => ({
  send: jest.fn(),
  registerWebhook: jest.fn()
}));

jest.mock('../../utils/notifications', () => ({
  emit: jest.fn()
}));

jest.mock('../../utils/misc', () => ({
  getConfig: () => ({
    telegram: { token: 'mytoken', site: 'example.com' },
    site: 'example.com'
  })
}));

describe('Telegram Bot Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      params: { token: 'mytoken' },
      body: {
        message: {
          chat: { id: 100 },
          from: { id: 100 },
          text: ''
        }
      },
      log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
      dal: {
        user: {
          insertTGUserVerificationCode: jest.fn(),
          updateTGUserVerificationPhone: jest.fn(),
          findUserByPhone: jest.fn(),
          createUserByPhone: jest.fn(),
          getTGVerificationCodeByPhone: jest.fn(),
        }
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  it('should return 200 and exit if token mismatch', async () => {
    req.params.token = 'wrongtoken';
    req.lof = { error: jest.fn() };
    await tgBot.incommingWebhook(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(req.lof.error).toHaveBeenCalled();
  });

  it('should skip if not private message', async () => {
    req.body.message.chat.id = 101; // different from from.id
    await tgBot.incommingWebhook(req, res);
    expect(req.log.debug).toHaveBeenCalledWith(expect.stringContaining('skipping incoming message'));
  });

  describe('/start command', () => {
    it('should handle /start auth without code', async () => {
      req.body.message.text = { startsWith: () => true, split: () => ['/start', ''] };
      
      await tgBot.incommingWebhook(req, res);
      expect(events.emit).toHaveBeenCalledWith('auth.tg.verification.error', expect.any(Object));
      expect(telegram.send).toHaveBeenCalledWith('mytoken', 100, expect.stringContaining('Что-то пошло не так'));
    });

    it('should handle /start auth with code but DB fails', async () => {
      req.body.message.text = '/start auth 1234';
      req.dal.user.insertTGUserVerificationCode.mockResolvedValue({ changes: 0 });
      await tgBot.incommingWebhook(req, res);
      expect(events.emit).toHaveBeenCalledWith('auth.tg.verification.error', expect.any(Object));
      expect(telegram.send).toHaveBeenCalledWith('mytoken', 100, expect.stringContaining('Неизвестная ошибка'));
    });

    it('should handle /start auth with code successfully', async () => {
      req.body.message.text = '/start auth 1234';
      req.dal.user.insertTGUserVerificationCode.mockResolvedValue({ changes: 1 });
      await tgBot.incommingWebhook(req, res);
      expect(telegram.send).toHaveBeenCalledWith('mytoken', 100, expect.stringContaining('Привет!'), expect.any(Object));
    });
  });

  describe('contact message', () => {
    beforeEach(() => {
      req.body.message.contact = { user_id: 100, phone_number: '79991234567', first_name: 'John', last_name: 'Doe' };
    });

    it('should reject if contact user_id mismatch', async () => {
      req.body.message.contact.user_id = 999;
      await tgBot.incommingWebhook(req, res);
      expect(telegram.send).toHaveBeenCalledWith('mytoken', 100, expect.stringContaining('Нужен именно твой номер'), expect.any(Object));
    });

    it('should handle DB failure on update phone', async () => {
      req.dal.user.updateTGUserVerificationPhone.mockResolvedValue({ changes: 0 });
      await tgBot.incommingWebhook(req, res);
      expect(events.emit).toHaveBeenCalledWith('auth.tg.verification.error', expect.any(Object));
    });

    it('should handle successful contact info and user creation', async () => {
      req.dal.user.updateTGUserVerificationPhone.mockResolvedValue({ changes: 1 });
      req.dal.user.findUserByPhone.mockResolvedValue(null);
      req.dal.user.createUserByPhone.mockResolvedValue({ id: 1 });
      req.dal.user.getTGVerificationCodeByPhone.mockResolvedValue('code123');

      await tgBot.incommingWebhook(req, res);
      
      expect(events.emit).toHaveBeenCalledWith('user.new', expect.any(Object));
      expect(telegram.send).toHaveBeenCalledWith('mytoken', 100, expect.stringContaining('Ура!'), expect.any(Object));
    });

    it('should handle missing verification code', async () => {
      req.dal.user.updateTGUserVerificationPhone.mockResolvedValue({ changes: 1 });
      req.dal.user.findUserByPhone.mockResolvedValue({ id: 1 });
      req.dal.user.getTGVerificationCodeByPhone.mockResolvedValue(null);

      await tgBot.incommingWebhook(req, res);
      
      expect(events.emit).toHaveBeenCalledWith('auth.tg.verification.error', expect.any(Object));
    });
  });

  it('should debug log unknown command', async () => {
    req.body.message.text = 'hello';
    await tgBot.incommingWebhook(req, res);
    expect(req.log.debug).toHaveBeenCalledWith(expect.stringContaining('unknown bot command'));
  });
});

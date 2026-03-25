const userController = require('../../api/user');
const events = require('../../utils/notifications');
const smsGate = require('../../connector/twilio');
const utils = require('../../utils/misc');

jest.mock('../../utils/notifications', () => ({
  emit: jest.fn()
}));

jest.mock('../../connector/twilio', () => ({
  sendSMS: jest.fn()
}));

const config = utils.getConfig();

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    req = {
      params: {},
      userId: null,
      ip: '127.0.0.1',
      log: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
      dal: {
        user: {
          getTGVerificationPhoneByCode: jest.fn(),
          findUserByPhone: jest.fn(),
          createUserByPhone: jest.fn(),
          getUser: jest.fn(),
          createVerificationCode: jest.fn(),
          getVerificationCode: jest.fn(),
          updateUser: jest.fn(),
        },
        payment: {
          getUserCredits: jest.fn(),
        }
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      cookie: jest.fn().mockReturnThis(),
      redirect: jest.fn(),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('get()', () => {
    it('should return unauthenticated state if no userId and no code', async () => {
      await userController.get(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ auth: false }));
    });

    it('should authenticate by code and create user', async () => {
      req.params.code = '1234';
      req.dal.user.getTGVerificationPhoneByCode.mockResolvedValue('79991234567');
      req.dal.user.findUserByPhone.mockResolvedValue(null);
      req.dal.user.createUserByPhone.mockResolvedValue({ userId: 10 });

      await userController.get(req, res);
      expect(req.dal.user.createUserByPhone).toHaveBeenCalledWith('79991234567');
      expect(res.cookie).toHaveBeenCalledWith('auth', expect.any(String), expect.any(Object));
      expect(events.emit).toHaveBeenCalledWith('user.new', { phone: '79991234567' });
    });

    it('should set authLinkExpired if isLink param provided and no code matches', async () => {
      req.params.code = 'invalid';
      req.params.isLink = 'true';
      req.dal.user.getTGVerificationPhoneByCode.mockResolvedValue(null);

      await userController.get(req, res);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ authLinkExpired: true }));
    });

    it('should return user data if authenticated', async () => {
      req.userId = 10;
      req.dal.user.getUser.mockResolvedValue({ name: 'Test User' });
      req.dal.payment.getUserCredits.mockResolvedValue(50);

      await userController.get(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        auth: true,
        name: 'Test User',
        credits: 50
      }));
    });
  });

  describe('sendCheckCode()', () => {
    it('should format phone and send SMS correctly', async () => {
      req.params.phone = '8(999)123-45-67'; // should format to 79991234567
      req.dal.user.createVerificationCode.mockResolvedValue('5555');
      smsGate.sendSMS.mockResolvedValue(true);

      await userController.sendCheckCode(req, res);
      jest.runAllTimers();

      expect(req.dal.user.createVerificationCode).toHaveBeenCalledWith('79991234567');
      expect(smsGate.sendSMS).toHaveBeenCalledWith('79991234567', '5555');
      expect(res.send).toHaveBeenCalledWith({ ok: true });
    });

    it('should handle BAD_PHONE_NUMBER error', async () => {
      req.params.phone = '79991234567';
      req.dal.user.createVerificationCode.mockResolvedValue('5555');
      smsGate.sendSMS.mockRejectedValue('BAD_PHONE_NUMBER');

      await userController.sendCheckCode(req, res);
      jest.runAllTimers();

      expect(req.log.warn).toHaveBeenCalledWith(expect.stringContaining('bad phone number'));
      expect(res.send).toHaveBeenCalledWith({ ok: false });
    });
    
    it('should handle generic error', async () => {
      req.params.phone = '79991234567';
      req.dal.user.createVerificationCode.mockResolvedValue('5555');
      smsGate.sendSMS.mockRejectedValue(new Error('Some error'));

      await userController.sendCheckCode(req, res);
      jest.runAllTimers();

      expect(req.log.error).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith('user.sms.error', expect.any(Object));
      expect(res.send).toHaveBeenCalledWith({ ok: false });
    });
  });

  describe('auth()', () => {
    it('should return auth: false if code is invalid', async () => {
      req.params.phone = '79991234567';
      req.params.code = '1234';
      req.dal.user.getVerificationCode.mockResolvedValue(null);

      await userController.auth(req, res);
      expect(res.send).toHaveBeenCalledWith({ auth: false });
    });

    it('should redirect to expired link if invalid code and redirect param true', async () => {
      req.params.phone = '79991234567';
      req.params.code = '1234';
      req.params.redirect = 'true';
      req.dal.user.getVerificationCode.mockResolvedValue(null);

      await userController.auth(req, res);
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('expired=true'));
    });

    it('should authenticate user if code matches', async () => {
      req.params.phone = '79991234567';
      req.params.code = '1234';
      req.dal.user.getVerificationCode.mockResolvedValue({ phone: '79991234567', code: '1234' });
      req.dal.user.findUserByPhone.mockResolvedValue({ userId: 10 });

      await userController.auth(req, res);
      expect(res.cookie).toHaveBeenCalledWith('auth', expect.any(String), expect.any(Object));
      expect(res.send).toHaveBeenCalledWith({ auth: true });
    });

    it('should redirect on success if redirect param true', async () => {
      req.params.phone = '79991234567';
      req.params.code = '1234';
      req.params.redirect = 'true';
      req.dal.user.getVerificationCode.mockResolvedValue({ phone: '79991234567', code: '1234' });
      req.dal.user.findUserByPhone.mockResolvedValue({ userId: 10 });

      await userController.auth(req, res);
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('login'));
      expect(events.emit).toHaveBeenCalledWith('user.enter.by.link', { phone: '79991234567' });
    });
  });

  describe('set()', () => {
    it('should update user name', async () => {
      req.userId = 10;
      req.params.name = 'New Name';
      await userController.set(req, res);
      expect(req.dal.user.updateUser).toHaveBeenCalledWith(10, 'New Name');
      expect(res.send).toHaveBeenCalledWith({ ok: true });
    });
  });

  describe('exit()', () => {
    it('should clear auth cookie', async () => {
      req.userId = 10;
      await userController.exit(req, res);
      expect(res.cookie).toHaveBeenCalledWith('auth', '');
      expect(res.send).toHaveBeenCalledWith({ ok: true });
    });
  });

  describe('owner methods', () => {
    beforeEach(() => {
      req.userId = config.ownerId; // Mock to be owner
    });

    it('getLoginLinkByPhone should return 403 if not owner', async () => {
      req.userId = 999; // Not owner
      await userController.getLoginLinkByPhone(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('getLoginLinkByPhone should return link for owner', async () => {
      req.params.phone = '79991234567';
      req.dal.user.createVerificationCode.mockResolvedValue('1234');
      await userController.getLoginLinkByPhone(req, res);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ link: expect.any(String), ok: true }));
    });

    it('getUserAuthByPhone should return 403 if not owner', async () => {
      req.userId = 999;
      await userController.getUserAuthByPhone(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('getUserAuthByPhone should return auth cookie for owner', async () => {
      req.params.phone = '79991234567';
      req.dal.user.findUserByPhone.mockResolvedValue({ userId: 10 });
      await userController.getUserAuthByPhone(req, res);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ auth: expect.any(String), ok: true }));
    });

    it('getUserAuthById should return 403 if not owner', async () => {
      req.userId = 999;
      await userController.getUserAuthById(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('getUserAuthById should return auth cookie for owner', async () => {
      req.params.id = 10;
      await userController.getUserAuthById(req, res);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ auth: expect.any(String), ok: true }));
    });
  });
});

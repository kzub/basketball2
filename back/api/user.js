const authLib = require('../utils/auth');
const events = require('../utils/notifications');
const smsGate = require('../connector/twilio');
const utils = require('../utils/misc');

const config = utils.getConfig();
const payEnv = {
  payEnv: config.payproxy.env
};

const get = async (req, res) => {
  if (!req.userId) {
    res.status(200).send({
      auth: false,
      ...payEnv,
    });
    return;
  }

  const user = await req.dal.user.getUser(req.userId);
  const credits = await req.dal.payment.getUserCredits(req.userId);
  const isSystemOwner = config.ownerId === req.userId;

  res.status(200).send({
    auth: true,
    ...user,
    credits,
    ...payEnv,
    isSystemOwner,
  });
};

const formatPhone = phoneNumber => {
  let phone = phoneNumber.toString();
  if (phone[0] === '8') { // 89154443322 -> 79154443322
    phone = '7' + phone.slice(1);
  }
  else if (phone[0] !== '+' && phone[0] !== '7') { // 9154443322 -> 79154443322
    phone = '7' + phone;
  }
  phone = phone.replace(/[()\W\-+]/g, ''); // +7(915)444-44-33 -> 79154443322
  return phone;
};

const sendCheckCode = async (req, res) => {
  const phone = formatPhone(req.params.phone);
  const code = await req.dal.user.createVerificationCode(phone);
  let ok = true;
  req.log.info(`sendCheckCode phone: ${phone}, code: ${code}`);
  try {
    await smsGate.sendSMS(phone, code);
    events.emit('user.sms', { phone, code });
  } catch (err) {
    ok = false;
    if (err === 'BAD_PHONE_NUMBER') {
      req.log.warn(`SMSAUTH: bad phone number: ${phone}`);
    }
    else {
      events.emit('user.sms.error', { phone, code, err });
      req.log.error(`SMSAUTH: ${err}`);
    }
  }
  setTimeout(function(){
    res.status(200).send({
      ok,
    });
  }, 1000);
};

const auth = async (req, res) => {
  const phone = formatPhone(req.params.phone);
  const code = req.params.code;

  const check = await req.dal.user.getVerificationCode(phone);

  if (!check || code !== check.code || phone !== check.phone) {
    req.log.warn(`Bad authorization attempt: ${phone}, ${code}, ${JSON.stringify(check)}`);
    res.status(200).send({
      auth: false,
    });
    return;
  }

  // check ok, find or create new user
  let user = await req.dal.user.findUserByPhone(phone);
  if (!user) {
    user = await req.dal.user.createUserByPhone(phone);
    events.emit('user.new', { phone });
  }
  if (!user) {
    throw new Error('auth: cannot find/create user ${phone}');
  }

  await req.dal.user.deleteVerificationCode(phone);

  const authCookie = authLib.encode(user.userId);
  req.log.debug(`set auth '${authCookie}' for userId: ${user.userId}`);
  res.cookie('auth', authCookie, {
    expires: new Date(Date.now() + 1000*60*60*24*365*10),
    httpOnly: true,
  });

  if (req.params.redirect) {
    events.emit('user.enter.by.link', { phone });
    res.redirect(`https://${config.site}/`);
    return;
  }

  res.status(200).send({
    auth: true,
  });
};

const set = async (req, res) => {
  req.log.info(`set userId: ${req.userId}, name: ${req.params.name}`);
  await req.dal.user.updateUser(req.userId, req.params.name);
  res.status(200).send({
    ok: true,
  });
};

const exit = async (req, res) => {
  req.log.info(`exit userId: ${req.userId}`);
  res.cookie('auth', '').status(200).send({
    ok: true,
  });
};

// owner's methods
// -------------------------------------------------------------------------
const getLoginLinkByPhone = async (req, res) => {
  if (req.userId !== config.ownerId) {
    res.status(403).send({
      error: true,
      comment: 'you are not allowed to do this',
    });
    return;
  }

  const phone = formatPhone(req.params.phone);
  const code = await req.dal.user.createVerificationCode(phone);
  const link = `https://${config.site}/api/user/auth/${phone}/${code}/true`;
  req.log.info(`getLoginLinkByPhone phone: ${phone}, link: ${link}`);

  res.status(200).send({
    link,
    ok: true,
  });
};

const getUserAuthByPhone = async (req, res) => {
  if (req.userId !== config.ownerId) {
    res.status(403).send({
      error: true,
      comment: 'you are not allowed to do this',
    });
    return;
  }
  const phone = formatPhone(req.params.phone);
  const user = await req.dal.user.findUserByPhone(phone);
  const authCookie = authLib.encode(user.userId);
  req.log.info(`getUserAuthByPhone phone: ${phone}, auth: ${authCookie}`);
  res.status(200).send({
    auth: authCookie,
    ok: true,
  });
};

const getUserAuthById = async (req, res) => {
  if (req.userId !== config.ownerId) {
    res.status(403).send({
      error: true,
      comment: 'you are not allowed to do this',
    });
    return;
  }
  const userId = req.params.id;
  const authCookie = authLib.encode(userId);
  req.log.info(`getUserAuthById userId: ${userId}, auth: ${authCookie}`);
  res.status(200).send({
    auth: authCookie,
    ok: true,
  });
};

module.exports = {
  auth,
  exit,
  get,
  getLoginLinkByPhone,
  getUserAuthById,
  getUserAuthByPhone,
  sendCheckCode,
  set,
};
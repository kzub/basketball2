const authLib = require('../utils/auth');

const get = async (req, res) => {
  if (!req.userId) {
    res.status(200).send({
      auth: false,
    });
    return;
  }

  const user = await req.dal.user.getUser(req.userId);
  res.status(200).send({
    auth: true,
    ...user,
  });
};

const formatPhone = phoneNumber => {
  let phone = phoneNumber.toString();
  if (phone[0] === '8') { // 89154443322 -> 79154443322
    phone = '7' + phone.slice(1); 
  }
  else if (phone[0] !== '+') { // 9154443322 -> 79154443322
    phone = '7' + phone;
  }
  phone = phone.replace(/[()\W\-+]/g, ''); // +7(915)444-44-33 -> 79154443322
  return phone;
};

const sendCheckCode = async (req, res) => {
  const phone = formatPhone(req.params.phone);
  const code = await req.dal.user.createVerificationCode(phone);
  req.log.debug(`phone: ${phone}, code: ${code}`);
  res.status(200).send({
    ok: true,
  });
};

const auth = async (req, res) => {
  const phone = formatPhone(req.params.phone);
  const code = req.params.code;
  const name = req.params.name;

  const check = await req.dal.user.getVerificationCode(phone);

  if (!check || code !== check.code || phone !== check.phone) {
    req.log.warn(`Bad authorization attempt: ${phone}, ${code}, ${JSON.stringify(check)}`);
    res.status(200).send({
      auth: false,
    });
    return;
  }
  
  // check ok - find or create user
  let user = await req.dal.user.findUserByPhone(phone);
  if (!user) {
    user = await req.dal.user.createUserByPhone(phone);
  }
  if (!user) {
    throw new Error('auth: cannot find/create user ${phone}');
  }

  await req.dal.user.deleteVerificationCode(phone);
  
  const authCookie = authLib.encode(user.userId);
  req.log.debug(`set auth '${authCookie}' for userId: ${user.userId}`);
  res.cookie('auth', authCookie).status(200).send({
    auth: true,
    ...user,
  });
};

const set = async (req, res) => {
  req.log.info(`set userId: ${req.userId}, name: ${req.params.name}`);
  const users = await req.dal.user.updateUser(req.userId, req.params.name);
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

module.exports = {
  get,
  sendCheckCode,
  auth,
  set,
  exit,
};
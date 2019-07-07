const crypto = require('crypto');

const utils = require('./misc');
const config = utils.getConfig();

const decode = (token) => {
  if (!token) {
    return undefined;
  }
  try {
    const decipher = crypto.createDecipher(config.auth.algorithm, config.auth.key);
    let text = decipher.update(token, 'hex', 'utf8')
    text += decipher.final('utf8');

    const [salt, userId] = text.split(':');
    if (salt !== config.auth.salt) {
      return undefined;
    }
    if (isNaN(userId) || !isFinite(userId)) {
      return undefined;
    }
    return Number(userId);
  } catch (err) {
    return undefined;
  }
};

const encode = (userId) => {
  if (userId == undefined || !isFinite(userId) || isNaN(Number(userId))) {
    throw new Error(`auth.js encode(): bad userId ${userId}`);
  }
  const cipher = crypto.createCipher(config.auth.algorithm, config.auth.key);
  let token = cipher.update(config.auth.salt + ':' + userId, 'utf8', 'hex');
  token += cipher.final('hex');
  return token;
};

module.exports = { decode, encode };
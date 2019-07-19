const utils = require('../utils/misc');
const config = utils.getConfig();

const client = require('twilio')(config.twilio.accountSid, config.twilio.authToken);

const sendSMS = async (number, text) => {
  return new Promise((resolve, reject) => {
    client.messages.create({
      to: number,
      from: config.twilio.senderNumber,
      body: text,
    }, (err, message) => {
      // console.log(err, message);
      if (err) {
        if (err.code === 21211) {
          reject('BAD_PHONE_NUMBER');
          return;
        }
        reject(err);
      }
      else resolve(message);
    });
  });
};

module.exports = {
  sendSMS,
};
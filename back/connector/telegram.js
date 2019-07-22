const logger = require('../utils/logger');
const request = require('request-promise-native');
const utils = require('../utils/misc');

const config = utils.getConfig();
const log = logger.create('SERVER');

const botCmd = async (token, method, params) => {
  const url = `${config.telegram.host}/bot${token}/${method}`;
  let opts = {
    url,
    method: 'POST',
    formData: params,
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  return request(opts).catch(err => {
    log.error(`cannot connect to telegram ${err}`);
  });
};

const send = async (token, chatId, msg) => {
  return botCmd(token, 'sendMessage', {
    chat_id: chatId,
    text: msg
  });
};

const getUpdates = (token) => {
  botCmd(token, 'getUpdates',{
    offset: -1
  }).then( r => {
    console.log(r);
  });
};
// getUpdates();

module.exports = {
  send,
  getUpdates,
};
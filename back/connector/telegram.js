const logger = require('../utils/logger');
const request = require('request-promise-native');
const utils = require('../utils/misc');

const config = utils.getConfig();
const log = logger.create('TELEGRAM');
const resendLog = [];

//-----------------------------------------------------------
const botCmd = async (token, method, params, tryNum = 1) => {
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
    log.error(`cannot send (try ${tryNum}): ${err}`);
    resendLog.push({
      sendAt: Date.now() + 60000,
      token,
      method,
      params,
      tryNum: tryNum + 1,
    });
  });
};

//-----------------------------------------------------------
const send = async (token, chatId, msg) => {
  // console.log(token, chatId, msg)
  return botCmd(token, 'sendMessage', {
    chat_id: chatId,
    text: msg,
    parse_mode: 'markdown',
    disable_web_page_preview: 'true',
  });
};

//-----------------------------------------------------------
const resendRoutine = () => {
  const msg = resendLog.shift();
  if (!msg) {
    return;
  }
  if (msg.tryNum > 30) {
    log.error(`drop trying resend message: ${JSON.stringify(msg)}`);
    return;
  }
  if (msg.sendAt > Date.now()) {
    resendLog.unshift(msg);
    return;
  }

  log.info(`try resend message: ${JSON.stringify(msg)}`);
  botCmd(msg.token, msg.method, msg.params, msg.tryNum);
};

// check every second, but send one message per function call
setInterval(resendRoutine, 1000);

//-----------------------------------------------------------
const getUpdates = (token) => {
  if (!token) { throw new Error('no token'); }
  botCmd(token, 'getUpdates',{
    offset: -1
  }).then( r => {
    console.log(r);
  });
};
// getUpdates(config.telegram.token);

// send(config.telegram.token, 139323428, `
//  оплатите игру по [ссылке](https://basket.msk.ru/#/payments?gameId=5)
// `)

module.exports = {
  send,
  getUpdates,
};
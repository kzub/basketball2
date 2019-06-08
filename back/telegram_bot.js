const request = require('async-request');
const utils = require('./utils');
const config = utils.getConfig();

const botURL = `https://api.telegram.org/bot${config.telegram.token}/`;
const recipients = {
  owner: config.telegram.owner,
  channel: config.telegram.channel,
  channelTest: config.telegram.channelTest
};

async function botCmd(method, params) {
  let url = botURL + method;
  let opts = {
    method: 'POST',
    data: params,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  return request(url, opts).catch(err => console.log(`telegramm bot error: ${err}`));
}

exports.send = async (who, msg) => {
  // console.log('bot', msg)
  let id = recipients[who] || recipients.owner;
  return botCmd('sendMessage', {
    chat_id: id,
    text: msg
  });
};

function getUpdates() { // eslint-disable-line no-unused-vars
  botCmd('getUpdates',{
    offset: -1
  }).then( r => {
    console.log(r);
  });
}
// getUpdates();
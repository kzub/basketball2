const utils = require('../utils/misc');
const request = require('request-promise-native');

const config = utils.getConfig();

const proxyPayment = (paymentEnvironment, req) => {
  const backend = config.payproxy.backends.reduce((res, elm) => elm.env === paymentEnvironment ? elm : res);

  if (!backend) {
    req.log.error(`proxyPayment() no backend found for ${paymentEnvironment}`);
    return;
  }

  const uri = `http://${backend.host}:${backend.port}${req.originalUrl}`;
  req.log.info(`proxyPayment() proxing to ${uri}`);
  
  request
    .post({
      uri,
      body: req.body,
      json: true,
    })
    .catch (err => {
      req.log.error(`proxy payment error: ${err.message}`);
    });

};

module.exports = {
  proxyPayment,
};
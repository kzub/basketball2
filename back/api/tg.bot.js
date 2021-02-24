const events = require('../utils/notifications');
const utils = require('../utils/misc');
// const payproxy = require('../connector/payproxy');
const telegram = require('../connector/telegram');

const config = utils.getConfig();

// ------------------------------------------------------------------------------
const incommingWebhook = async (req, res) => {
  // const [paymentEnvironment, paymentEvent, ...labelData] = label.split('|');
  // if (config.payproxy.backends && paymentEnvironment != config.payproxy.env) {
  //   req.log.info(`proxy payment to ${paymentEnvironment}`);
  //   payproxy.proxyPayment(paymentEnvironment, req);
  //   return;
  // }
  req.log.info(JSON.stringify(req.body, null, 2));
  res.status(200).send('OK');
  if (decodeURIComponent(req.params.token) !== config.telegram.token) {
    req.lof.error(`webhook token mismatch ${req.params.token}`);
    return;
  }

  if (!req.body.message || (req.body.message.chat.id !== req.body.message.from.id)) { // only private messages)
    req.log.debug(`skipping incoming message ${JSON.stringify(req.body.message)}`);
    return;
  }

  if (req.body.message.text && req.body.message.text.startsWith('/start')) {
    const [ , code] = req.body.message.text.split(' ');

    await req.dal.user.insertTGUserVerificationCode(req.body.message.from.id, code);

    telegram.send(config.telegram.token, req.body.message.chat.id, `Привет!
Чтобы иметь возможность связаться с участниками игры, нужен твой номер телефона.
Номер будет доступен только организиторам игры, на которые ты запишешься.
Для продолжения нажми кнопку "Зарегистрироваться" внизу.`, {
      reply_markup: JSON.stringify({
        keyboard: [
          [{ text: 'Зарегистрироваться', request_contact: true }],
        ],
        one_time_keyboard: true,
      }),
    });
    return;
  }

  if (req.body.message.contact) {
    if (req.body.message.contact.user_id !== req.body.message.from.id) {
      telegram.send(config.telegram.token, req.body.message.chat.id, `Нужен именно твой номер телефона.
Нажми кнопку "Зарегистрироваться" внизу.`, {
        reply_markup: JSON.stringify({
          keyboard: [
            [{ text: 'Зарегистрироваться', request_contact: true }],
          ],
          // one_time_keyboard: true,
          resize_keyboard: true,
        }),
      });
      return;
    }
    // check ok, find or create new user
    const contact = req.body.message.contact;
    await req.dal.user.insertTGUserVerificationPhone(req.body.message.from.id, contact.phone_number);

    let user = await req.dal.user.findUserByPhone(contact.phone_number);
    if (!user) {
      user = await req.dal.user.createUserByPhone(contact.phone_number);
      events.emit('user.new', {
        phone: contact.phone_number,
        tgName: `${contact.first_name} ${contact.last_name}`,
      });
    }

    await telegram.send(config.telegram.token, req.body.message.chat.id, `Ура!
Пользователь с номером ${contact.phone_number} подтвержден.
Возвращайся обратно на сайт!`, {
      reply_markup: JSON.stringify({
        remove_keyboard: true,
      }),
    });
    return;
  }

  req.log.debug(`unknown bot command: ${JSON.stringify(req.body.message)}`);
};

telegram.registerWebhook();

module.exports = {
  incommingWebhook,
};

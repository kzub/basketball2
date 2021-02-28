const events = require('../utils/notifications');
const utils = require('../utils/misc');
// const payproxy = require('../connector/payproxy');
const telegram = require('../connector/telegram');

const config = utils.getConfig();

// ------------------------------------------------------------------------------
const incommingWebhook = async (req, res) => {
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

  if (req.body.message.text && req.body.message.text.startsWith('/start auth')) {
    const [ , code] = req.body.message.text.split(' ');

    if (!code) {
      req.log.error('/start without code');
      events.emit('auth.tg.verification.error', {
        stage: 'startWithoutCode',
        tgId: req.body.message.from.id,
      });
      telegram.send(config.telegram.token, req.body.message.chat.id, `Что-то пошло не так =(
Попробуй пройти регистрацию с самого начала.`);
      return;
    }

    const insert = await req.dal.user.insertTGUserVerificationCode(req.body.message.from.id, code);
    if (!insert.changes) {
      req.log.error(`insertTGUserVerificationCode result: ${JSON.stringify(insert)}`);
      events.emit('auth.tg.verification.error', {
        stage: 'insertCodeByTGId',
        tgId: req.body.message.from.id,
      });
      telegram.send(config.telegram.token, req.body.message.chat.id, `Неизвестная ошибка =(
Попробуй пройти регистрацию с самого начала.`);
      return;
    }

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
    let update = await req.dal.user.updateTGUserVerificationPhone(req.body.message.from.id, contact.phone_number);
    if (!update.changes) {
      req.log.error(`updateTGUserVerificationPhone result: ${JSON.stringify(update)}`);
      events.emit('auth.tg.verification.error', {
        stage: 'updatePhoneInDB',
        tgId: req.body.message.from.id,
        phone: contact.phone_number,
        tgName: `${contact.first_name} ${contact.last_name}`,
      });
      telegram.send(config.telegram.token, req.body.message.chat.id, `Неизвестная ошибка =(
Попробуй пройти регистрацию с самого начала.`);
      return;
    }

    let user = await req.dal.user.findUserByPhone(contact.phone_number);
    if (!user) {
      user = await req.dal.user.createUserByPhone(contact.phone_number);
      events.emit('user.new', {
        phone: contact.phone_number,
        tgName: `${contact.first_name} ${contact.last_name}`,
      });
    }

    const code = await req.dal.user.getTGVerificationCodeByPhone(contact.phone_number);
    if (!code) {
      req.log.error(`getTGVerificationCodeByPhone result: ${JSON.stringify(code)}, contact.phone_number: ${contact.phone_number}`);
      events.emit('auth.tg.verification.error', {
        stage: 'getCodeForAuthLink',
        tgId: req.body.message.from.id,
        phone: contact.phone_number,
        tgName: `${contact.first_name} ${contact.last_name}`,
      });
      telegram.send(config.telegram.token, req.body.message.chat.id, `Неизвестная ошибка =(
Попробуй пройти регистрацию с самого начала.`);
      return;
    }

    await telegram.send(config.telegram.token, req.body.message.chat.id, `Ура!
Пользователь с номером ${contact.phone_number} подтвержден.
Возвращайся на сайт или перейди по [ссылке](https://${config.site}/#/profile/login?ac=${code})`, {
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

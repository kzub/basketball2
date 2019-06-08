const fs = require('fs');
const promisify = require('util').promisify;
const readFile = promisify(fs.readFile);

const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const monthsOfYear = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
exports.getBeautifulDate = (ts) => {
  const date = new Date(ts);
  const weekDay = daysOfWeek[date.getDay()];
  const monthDay = date.getDate();
  const month = monthsOfYear[date.getMonth()];
  return `${weekDay}, ${monthDay} ${month}`;
};

exports.getGameSettingsOld = async () => {
  let data = await readFile('settings.game.json');
  let mode = getMode();
  return JSON.parse(data)[mode];
};

exports.findBookInfoInMailText = (text) => {
  let res = text.match(/Зарегистрировался новый игрок:.*, id тренировки - \d*/);
  if (!res || !res.length) {
    return;
  }
  let parts = res[0].split(', id тренировки - ');
  if (!parts || parts.length < 2){
    return;
  }
  let [name, gameId] = parts;
  if (!isFinite(gameId)) {
    return;
  }
  name = name.slice(31);
  return { gameId, name };
};

exports.getConfig = () => {
  let data = fs.readFileSync('settings.json');
  let mode = getMode();
  return JSON.parse(data)[mode];
};

exports.eq = (s1, s2) => {
  return s1 && s2 && s1.toLowerCase() == s2.toLowerCase();
};

function getMode () {
  let mode = process.env.BASKET_MODE;
  if (!mode || ['prod', 'dev'].indexOf(mode) === -1) {
    console.log('no mode specified');
    process.exit(-1);
  }
  return mode;
}
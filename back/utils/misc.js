const fs = require('fs');
const promisify = require('util').promisify;
const readFile = promisify(fs.readFile);

const dictDays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const dictMonths = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const dictMinutes = ['минут', 'минута', 'минуты', 'минуты', 'минуты', 'минут', 'минут', 'минут', 'минут', 'минут',
  'минут', 'минут', 'минут', 'минут', 'минут', 'минут', 'минут', 'минут', 'минут', 'минут'];

const dateWeekDay = (isoDate) => {
  const date = new Date(isoDate);
  const word = dictDays[date.getDay()];
  return word;
};

const dateDayAndMonth = (isoDate) => {
  const date = new Date(isoDate);
  const day = date.getDate();
  const month = dictMonths[date.getMonth()];
  return `${day} ${month}`;
};

const minutesTo = (timestamp) => {
  const now = Date.now();
  const diff =  timestamp - now;
  let minutes = Math.ceil(diff / 1000 / 60);
  if (minutes < 0) {
    minutes = 0;
  }
  return minutes;
};

const textMinutesTo = (timestamp) => {
  const minutes = minutesTo(timestamp);
  if (minutes < 20) {
    return `${minutes} ${dictMinutes[minutes]}`;
  }
  return `${minutes} ${dictMinutes[minutes % 10]}`;
};

const getBeautifulDate = (ts) => {
  const date = new Date(ts);
  const weekDay = dictDays[date.getDay()];
  const monthDay = date.getDate();
  const month = dictMonths[date.getMonth()];
  return `${weekDay}, ${monthDay} ${month}`;
};

const getStartOfTheDate = (date) => {
  const today = date || new Date();
  today.setSeconds(0);
  today.setMinutes(0);
  today.setHours(0);
  today.setMilliseconds(0);
  return today;
};

const getGameSettingsOld = async () => {
  let data = await readFile('settings.game.json');
  let mode = getMode();
  return JSON.parse(data)[mode];
};

const getConfig = () => {
  let data = fs.readFileSync('./config/settings.json');
  let mode = getMode();
  return JSON.parse(data)[mode];
};

const eq = (s1, s2) => {
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

const sleep = (ms) => {
  return new Promise(res => {
    setTimeout(res, ms);
  });
};

module.exports = {
  dateDayAndMonth,
  dateWeekDay,
  eq,
  getBeautifulDate,
  getConfig,
  getGameSettingsOld,
  getStartOfTheDate,
  minutesTo,
  sleep,
  textMinutesTo,
};

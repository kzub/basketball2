const fs = require('fs');

const dictDays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const dictMonths = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const dictMinutes = ['минут', 'минута', 'минуты', 'минуты', 'минуты', 'минут', 'минут', 'минут', 'минут', 'минут',
  'минут', 'минут', 'минут', 'минут', 'минут', 'минут', 'минут', 'минут', 'минут', 'минут'];
const dictHours = ['часов', 'час', 'часа', 'часа', 'часа', 'часов', 'часов', 'часов', 'часов', 'часов',
  'часов', 'часов', 'часов', 'часов', 'часов', 'часов', 'часов', 'часов', 'часов', 'часов'];

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


const dateAddDays = (isoDate, days) => {
  const date = new Date(isoDate);
  const newDate = new Date(date.valueOf() + days * 86400000);
  return newDate.toJSON().slice(0, 10);
};


const isTime = (time) => time && time.match && Boolean(time.match(/^\d\d:\d\d$/));

const compareTimes = (t1, t2) => {
  if (!isTime(t1) || !isTime(t2)) {
    return;
  }
  const [h1, m1] = t1.split(':').map(a => Number(a));
  const [h2, m2] = t2.split(':').map(a => Number(a));

  if (h1 < h2) {
    return -1;
  }
  if (h1 > h2) {
    return +1;
  }
  if (m1 < m2) {
    return -1;
  }
  if (m1 > m2) {
    return +1;
  }
  return 0; // equal
};

const isDate = (date) => date && date.match && Boolean(date.match(/^\d\d\d\d-\d\d-\d\d$/));

const compareDates = (date1, date2) => {
  if (!isDate(date1) || !isDate(date2)) {
    return;
  }
  const [y1, m1, d1] = date1.split('-').map(a => Number(a));
  const [y2, m2, d2] = date2.split('-').map(a => Number(a));
  if (y1 < y2) {
    return -1;
  }
  if (y1 > y2) {
    return +1;
  }
  if (m1 < m2) {
    return -1;
  }
  if (m1 > m2) {
    return +1;
  }
  if (d1 < d2) {
    return -1;
  }
  if (d1 > d2) {
    return +1;
  }
  return 0; // equal
};

const textMinutesTo = (timestamp) => {
  const minutes = minutesTo(timestamp);
  if (minutes < 20) {
    return `${minutes} ${dictMinutes[minutes]}`;
  }
  return `${minutes} ${dictMinutes[minutes % 10]}`;
};

const textHoursTo = (timestamp) => {
  const hours = Math.floor(minutesTo(timestamp)/60);
  if (hours < 20) {
    return `${hours} ${dictHours[hours]}`;
  }
  return `${hours} ${dictHours[hours % 10]}`;
};

const textHoursMinutesTo = (timestamp) => {
  let minutes = minutesTo(timestamp);
  let textMinutes;
  let textHours;

  const hours = Math.floor(minutes/60);
  if (hours < 20) {
    textHours = `${hours} ${dictHours[hours]}`;
  } else {
    textHours = `${hours} ${dictHours[hours % 10]}`;
  }

  minutes = minutes - hours * 60;
  if (minutes < 20) {
    textMinutes = `${minutes} ${dictMinutes[minutes]}`;
  } else {
    textMinutes = `${minutes} ${dictMinutes[minutes % 10]}`;
  }

  if (hours == 0) {
    return `${textMinutes}`;
  }

  if (minutes == 0) {
    return `${textHours}`;
  }

  return `${textHours} ${textMinutes}`;
};

const zeroPad = (time) => {
  if (time < 10) {
    return `0${time}`;
  }
  return `${time}`;
};

const generateTimeOptions = () => {
  const table = [];
  for (let hour = 0; hour < 24; hour++) {
    for(let minutes = 0; minutes < 60; minutes += 15) {
      table.push(`${zeroPad(hour)}:${zeroPad(minutes)}`);
    }
  }
  return table;
};

const getBeautifulDate = (ts) => {
  const date = new Date(ts);
  const weekDay = dictDays[date.getDay()];
  const monthDay = date.getDate();
  const month = dictMonths[date.getMonth()];
  return `${weekDay}, ${monthDay} ${month}`;
};

const GMT_OFFSET = 3;
const getLocalTime = () => {
  const now = new Date();
  now.setUTCHours(now.getUTCHours() + GMT_OFFSET);
  return now;
};

const getStartOfTheDate = (date) => {
  const today = date || new Date();
  today.setSeconds(0);
  today.setMinutes(0);
  today.setHours(0);
  today.setMilliseconds(0);
  return today;
};

const getConfig = () => {
  let data = fs.readFileSync('./config/settings.json', 'utf8');
  let mode = getMode();
  try {
    const strip = require('strip-json-comments');
    const stripFunc = strip.default || strip;
    return JSON.parse(stripFunc(data))[mode];
  } catch (err) {
    return JSON.parse(data)[mode];
  }
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
  compareDates,
  compareTimes,
  dateDayAndMonth,
  dateWeekDay,
  dateAddDays,
  eq,
  generateTimeOptions,
  getBeautifulDate,
  getConfig,
  getLocalTime,
  getStartOfTheDate,
  isTime,
  minutesTo,
  sleep,
  textHoursMinutesTo,
  textHoursTo,
  textMinutesTo,
};

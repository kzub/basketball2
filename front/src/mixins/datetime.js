const dictDays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
const dictMonths = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

const mxDateWeekDay = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00`)
  const word = dictDays[date.getDay()]
  return word
}

const mxDateDayAndMonth = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00`)
  const day = date.getDate();
  const month = dictMonths[date.getMonth()]

  return `${day} ${month}`
}

const dictMinutes = ['минут', 'минута', 'минуты', 'минуты', 'минуты', 'минут', 'минут', 'минут', 'минут', 'минут',
                     'минут', 'минут', 'минут', 'минут', 'минут', 'минут', 'минут', 'минут', 'минут', 'минут']
const dictHours = ['часов', 'час', 'часа', 'часа', 'часа', 'часов', 'часов', 'часов', 'часов', 'часов',
  'часов', 'часов', 'часов', 'часов', 'часов', 'часов', 'часов', 'часов', 'часов', 'часов'];

const mxMinutesTo = (timestamp) => {
  if (!timestamp) {
    return 0
  }
  const now = Date.now()
  const diff =  timestamp - now
  let minutes = Math.ceil(diff / 1000 / 60)
  if (minutes < 0) {
    minutes = 0
  }
  return minutes
}

const mxTextMinutesTo = (timestamp) => {
  const minutes = mxMinutesTo(timestamp);
  if (minutes < 20) {
    return `${minutes} ${dictMinutes[minutes]}`;
  }
  return `${minutes} ${dictMinutes[minutes % 10]}`;
};

const mxTextHoursTo = (timestamp) => {
  const hours = Math.floor(mxMinutesTo(timestamp)/60);
  if (hours < 20) {
    return `${hours} ${dictHours[hours]}`;
  }
  return `${hours} ${dictHours[hours % 10]}`;
};

const mxTextHoursMinutesTo = (timestamp) => {
  let minutes = mxMinutesTo(timestamp);
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

const mxAddDaysToDate = (isoDate, daysCount = 0) => {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setDate(date.getDate() + daysCount)
  return date.toJSON().slice(0, 10)
}

const mxNearestDayFromNow = (isoDate) => {
  const dayNum = new Date(`${isoDate}T00:00:00Z`).getDay()
  let date = new Date()
  while (date.getDay() != dayNum) {
    date.setDate(date.getDate() + 1)
  }
  return date.toJSON().slice(0, 10)
}

const mxDateDiff = (isoDate1, isoDate2) => {
  const date1 = new Date(`${isoDate1}T00:00:00Z`)
  const date2 = new Date(`${isoDate2}T00:00:00Z`)
  return Math.round(date1.valueOf() - date2.valueOf())/(1000*60*60*24)
}

export default {
  methods: {
    mxAddDaysToDate,
    mxDateDayAndMonth,
    mxDateDiff,
    mxDateWeekDay,
    mxMinutesTo,
    mxNearestDayFromNow,
    mxTextHoursMinutesTo,
    mxTextHoursTo,
    mxTextMinutesTo,
  }
}
const dictDays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
const dictMonths = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

const mxDateWeekDay = (isoDate) => {
	const date = new Date(isoDate)
	const word = dictDays[date.getDay()]
	return word
}

const mxDateDayAndMonth = (isoDate) => {
	const date = new Date(isoDate)
	const day = date.getDate();
	const month = dictMonths[date.getMonth()]

	return `${day} ${month}`
}

export default {
  methods: {
    mxDateWeekDay,
    mxDateDayAndMonth,
  }
}
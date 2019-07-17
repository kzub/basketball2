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

const dictMinutes = ['минут', 'минута', 'минуты', 'минуты', 'минуты', 'минут', 'минут', 'минут', 'минут', 'минут',
										 'минут', 'минут', 'минут', 'минут', 'минут', 'минут', 'минут', 'минут', 'минут', 'минут']

const mxMinutesTo = (timestamp) => {
	const now = Date.now()
	const diff =  timestamp - now
	let minutes = Math.ceil(diff / 1000 / 60)
	if (minutes < 0) {
		minutes = 0
	}
	return minutes
}

const mxTextMinutesTo = (timestamp) => {
	const minutes = mxMinutesTo(timestamp)
	if (minutes < 20) {
		return `${dictMinutes[minutes]}`
	}
	return `${dictMinutes[minutes % 10]}`
}

export default {
  methods: {
    mxDateWeekDay,
    mxDateDayAndMonth,
    mxMinutesTo,
    mxTextMinutesTo,
  }
}
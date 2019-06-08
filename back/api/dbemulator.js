

var games = [{
	place: {
		title: 'Манхетенн',
		description: 'м. Дмитровская, проезд дмитровский 2А',
		position: '55.806886,+37.588821',
	},
	gameId: 2,
	timeFrom: '10:00',
	timeTo: '11:00',
	date: '2019-01-21',
	organizer: {
		userId: 323,
		name: 'Зубков Константин',
		phone: '89154729813',
	},
	payment: {
		type: 'prepay',
		amount: 400,
		walletId: '2323232323',
		message: 'На карту 1111 3333 2222 4444',
	},
	status: 'settled',
	slots: [{
		rsvId: 12312,
		userId: 323,
		text: 'Зубков Константин',
		type: 'paid',
		phone: '89166206605',
  	},{
  		rsvId: 12318,
  		userId: 323,
  		text: 'Зубков Константин 2',
  		type: 'reserved',
  		phone: '89166206605',
  	},{
  		rsvId: 12313,
  		userId: 324,
  		text: 'Молотков Денис',
  		type: 'reserved',
  		phone: '89268212200',
  	},{
  		text: 'Забронировать',
  		type: 'empty',
  	},{
  		text: 'Забронировать',
  		type: 'empty',
  	},{
  		text: 'Забронировать',
  		type: 'empty',
  	}]
  },
  {
  	place: {
  		title: 'Образцова',
  		description: 'м. Савеловская, Образцова 14',
  		position: '55.806886,+37.588821',
  	},
  	gameId: 3,
  	timeFrom: '18:00',
  	timeTo: '19:00',
  	date: '2019-01-22',
  	organizer: {
  		userId: 324,
  		name: 'Молотков Денис',
  		phone: '89154729813',
  	},
  	payment: {
  		type: 'manualPay',
  		amount: 4000,
      // walletId: '2323232323',
      amountPerUser: 400,
      message: 'Переводом по номеру 89654402213 ВТБ, Сбер, Альфа или на карту 1111333322224444',
    },
    status: 'settled',
    slots: [{
      	rsvId: 12312,
      	userId: 323,
      	text: 'Зубков Константин',
      	type: 'paid',
      },{
      	rsvId: 12313,
      	userId: 323,
      	text: 'Молотков Денис',
      	type: 'reserved',
      },{
      	rsvId: 12314,
      	userId: 325,
      	text: 'Иванов Антон',
      	type: 'reserved',
      },{
      	rsvId: 12315,
      	userId: 326,
      	text: 'Горелов Василий',
      	type: 'reserved',
      },{
      	rsvId: 12316,
      	userId: 327,
      	text: 'Андрей Гончаров',
      	type: 'reserved',
      },{
      	text: 'Забронировать',
      	type: 'empty',
      },{
      	rsvId: 12317,
      	userId: 328,
      	type: 'waitlist',
      	text: 'Иванов Андрей',
      },{
      	rsvId: 12318,
      	userId: 329,
      	type: 'waitlist',
      	text: 'Дубов Алексей',
      }]
  },
  {
  	place: {
  		title: 'Образцова',
  		description: 'м. Савеловская, Образцова 14',
  		position: '55.806886,+37.588821',
  	},
  	gameId: 4,
  	timeFrom: '09:00',
  	timeTo: '10:00',
  	date: '2019-01-24',
  	organizer: {
  		userId: 324,
  		name: 'Молотков Денис',
  		phone: '89154729813',
  	},
  	payment: {
  		type: 'manualPay',
  		amount: 4000,
  		walletId: '2323232323',
  		message: 'на карту 1111 3333 2222 4444',
  	},
  	status: 'poll',
  	slots: [{
    		rsvId: 22312,
    		userId: 323,
    		text: 'Зубков Константин',
    		type: 'paid',
    	},{
    		rsvId: 22313,
    		userId: 324,
    		text: 'Молотков Денис',
    		type: 'reserved',
    	},{
    		rsvId: 22314,
    		userId: 323,
    		text: 'Иванов Антон',
    		type: 'reserved',
    	},{
    		text: 'Забронировать',
    		type: 'empty',
    	},{
    		text: 'Забронировать',
    		type: 'empty',
    	},{
    		text: 'Забронировать',
    		type: 'empty',
    	},{
    		type: 'empty-backup',
    		text: 'Записаться',
    	},
  ]}
]

let n = JSON.parse(JSON.stringify(games[0]))
n.gameId = 10
n.organizer.userId = 324
n.organizer.name = 'Артем Васильев'
games.unshift(n)  

const sleep = (ms) => {
  return new Promise(res => {
    setTimeout(res, ms);
  });
}

const getGamesList = async () => {
  await sleep(300);
  return games;
}

const getGameData = async (gameId) => {
  await sleep(300);
  return games.filter(game => game.gameId === gameId);
}

module.exports = {
  getGamesList,
  getGameData,
}

const express = require('express');
const bodyParser = require('body-parser');
const bot = require('./telegram_bot');
const utils = require('./utils');
const config = utils.getConfig();
const apiBook = require('./api2/book');
const apiGames = require('./api2/games');
const apiGame = require('./api2/game');
const apiUser = require('./api2/user');
// const smtpEvents = require('./smtp_server');

const app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const autoCancelation = require('./autoCancelation');
const engines = {
  basketmsk: require('./engine.basketmsk'),
  sqlite: require('./engine.sqlite')
};

// v2 api
app.post('/api/v2/book', apiBook);
app.get('/api/v2/user', apiUser);
app.get('/api/v2/game', apiGame);
app.get('/api/v2/games', apiGames);
// ------------------------

app.get('/', function (req, res) {
  res.status(404).send('Not Found\n');
});

app.get('/api/game/slots/:code?', async function (req, res) {
  try {
    const code = req.params.code;
    const isAdmin = code === config.admin.password;
    let games = await engines.sqlite.getGames(false, false, !isAdmin);
    let result = [];
    console.log(`GAME GET SLOTS -> (${code || '-'})`);

    for (let game of games) {
      let slots = await getGameSlots(game);
      let price = game.price;
      if (code && isFinite(game.props.netPrice) && config.admin.netPrice
        && (code === config.admin.netPrice)) {
        price = Number(game.props.netPrice);
      }
      result.push({
        gameId: game.id,
        date: game.date,
        time: game.time,
        price: price,
        place: {
          metro: game.place.metro,
          name: game.place.name,
          link: game.place.link,
        },
        slots: slots,
        payOnSite: Boolean(game.props.payOnSite),
        organizer: game.props.organizer && String(game.props.organizer),
        organizerPhone: game.props.organizerPhone && String(game.props.organizerPhone),
      });
      let playersCount = slots.filter(s => s.status !== 'free').length;
      console.log(`OK game ${game.id} - ${playersCount}/${slots.length}`);
    }

    res.send({ games: result });
  } catch(e) {
    res.status(500).send(
      makeError('/api/game/slots', e));
  }
});

async function getGameSlots(game) {
  let players = await engines.sqlite.getPlayers(game.id);
  let slots = [];
  players.reverse();

  for (let idx = 0; idx < game.maxPlayers; idx++) {
    let p = players[idx];
    if (p && p.payed) {
      slots.push({'status':'used', 'player':`${p.firstName} ${p.surName}`});
    } else if(p) {
      slots.push({'status':'booking', 'player':'В процессе оплаты'});
    } else {
      slots.push({'status':'free', 'player':'Забронировать'});
    }
  }

  return slots;
}

app.get('/api/game/book/:gameId/:name/:phone/:code?', async function (req, res) {
  try {
    console.log('GAME BOOK SLOT ->', req.params);

    let bookPayed = req.params.code === config.admin.password;
    if (bookPayed) {
      console.log('ADMIN PASSWORD USED. MAKE FREE BOOKING');
    }
    let game = await engines.sqlite.getGame(req.params.gameId);
    if (!game) {
      res.send(makeError('Внутреняя ошибка. Игра не найдена!', req.params));
      return;
    }

    if (game.price === 0) {
      bookPayed = true;
      console.log(`PayOnSite mode for ${game.id}. Make free booking`);
    }

    let players = await engines.sqlite.getPlayers(game.id);
    let freeSlots = game.maxPlayers - players.length;

    let [firstName, surName] = req.params.name.split(' ');
    if (!firstName || !surName) {
      res.send(
        makeError('Ошибка входных данных! Имя Фамилия', req.params));
      return;
    }

    let tel = req.params.phone;
    if (!tel) {
      res.send(
        makeError('Ошибка входных данных! Телефон', req.params));
      return;
    }
    let player;
    let playerBookings = players.filter(p => !p.payed && utils.eq(p.firstName, firstName) &&
                                                         utils.eq(p.surName, surName));
    if(playerBookings.length > 0) {
      console.log('CONTINUE booking process with existing booking', firstName, surName);
      player = playerBookings[0];
      if (player.payed !== bookPayed) {
        await engines.sqlite.updatePlayer(game.id, { id: player.id, payed: bookPayed });
      }
    } else {
      if (players.length >= game.maxPlayers) {
        res.send(
          makeError('Свободных мест нет!', game.maxPlayers, players));
        return;
      }

      console.log('MAKE booking', firstName, surName, tel);
      player = await engines.sqlite.addPlayer(game.id, {
        firstName: firstName,
        surName: surName,
        tel: tel,
        payed: bookPayed,
        sum: 0,
      });

      if (!player) {
        res.send(
          makeError('Регистрация не удалась!', players));
        return;
      }
      freeSlots--;
    }

    res.send({
      gameId: game.id,
      playerId: player.id,
      success: true,
      payed: bookPayed
    });

    if (bookPayed) {
      bot.send('owner', `Pay ok: [No Money] ${game.id}/${player.id} ${player.firstName} ${player.surName} ${tel} slots: ${freeSlots}`);
      if (game.enabled) {
        bot.send('channel', `${player.firstName} ${player.surName} записался на игру ${game.date}\r\nСвободных мест: ${freeSlots}, запись на basket.msk.ru`);
      }
      autoCancelation.del(game.id, player);
    } else {
      bot.send('owner', `Book ok: ${game.id}/${player.id} ${player.firstName} ${player.surName} ${tel} slots: ${freeSlots}`);
      autoCancelation.add(game.id, player, engines.sqlite.deletePlayer);
    }
    console.log(`BOOK OK game ${game.id} - ${player.id} ${player.firstName} ${player.surName} ${tel}`);
  } catch(e) {
    res.status(500).send(
      makeError('/api/game/book', req.params, e));
  }
});

app.post('/api/game/payment/complete', async function (req, res) {
  try {
    console.log('PAY NOTIFICATION ->');
    console.log(req.body);
    res.send('OK');

    let amount = req.body.withdraw_amount;

    if (!req.body.label || req.body.label.indexOf('|') === -1) {
      const msg = `Custom pay: ${amount} руб. (${(req.body.label || 'no label')}).`;
      bot.send('owner', msg);
      console.log(msg);
      return;
    }

    let [gameId, playerId] = req.body.label.split('|');
    let game = await engines.sqlite.getGame(gameId);
    if (!game) {
      printError(`Can not find game with id: ${gameId}, ${amount} руб.`);
      return;
    }

    let players = await engines.sqlite.getPlayers(gameId);
    let playerBookings = players.filter(p => p.id == playerId && !p.payed);

    if(playerBookings.length == 0) {
      printError(`Player ${gameId}/${playerId} has no bookings!`, players);
      return;
    }
    let player = playerBookings[0];

    let ok = await engines.sqlite.updatePlayer(game.id, {
      id: player.id,
      sum: game.priceBookEngine || Math.floor(Number(amount)),
      payed: true
    });

    if(!ok){
      printError(`Cannot update player email ${gameId}/${playerId}`, players);
      return;
    }

    let freeSlots = game.maxPlayers - players.length;
    bot.send('owner', `Pay ok: ${game.id}/${player.id} ${player.firstName} ${player.surName} ${amount} руб.`);
    if (game.enabled) {
      bot.send('channel', `${player.firstName} ${player.surName} записался на игру ${game.date}\r\nСвободных мест: ${freeSlots}, запись на basket.msk.ru`);
    }
    autoCancelation.del(game.id, player);
    console.log('OK', playerId, player.firstName, player.surName, amount);
  } catch(e) {
    res.status(500).send(
      makeError('/api/game/payment/complete', req.body, e));
  }
});

// ADMIN
// ------------------------------------------------
app.get('/api/game/list/:code?', async function (req, res) {
  try {
    if (req.params.code !== config.admin.password) {
      throw 'unauthorized access';
    }
    let games = await engines.sqlite.getGames(true, true, false);
    games.forEach(game => {
      game.date = utils.getBeautifulDate(game.date);
    });
    res.send(games);
  } catch(e) {
    res.status(500).send(
      makeError('/api/game/list', req.params.code, e));
  }
});

app.post('/api/game/copyGame', async function (req, res) {
  try {
    if (req.body.password !== config.admin.password) {
      throw 'unauthorized access';
    }
    const games = await engines.sqlite.getGames(true, true, false);
    const gameId = Number(req.body.gameId);
    const newDate = new Date(req.body.gameDate);

    const game = games.filter(g => g.id === gameId)[0];
    if (!game) {
      console.log(`copyGame: Game ${gameId} not found`);
      res.redirect('/zkadmin.html?' + req.body.password);
      return;
    }

    const { maxPlayers, price, time, props } = game;

    const newGameId = await engines.sqlite.insertGame(game.place.id, maxPlayers, price, newDate.valueOf(), time, props);
    console.log(`COPY GAME: ${gameId} -> ${newGameId}`);
    res.redirect('/zkadmin.html?' + req.body.password);
  } catch(e) {
    res.status(500).send(
      makeError('/api/game/list', req.body, e));
  }
});

app.post('/api/game/enableGame', async function (req, res) {
  try {
    if (req.body.password !== config.admin.password) {
      throw 'unauthorized access';
    }
    const games = await engines.sqlite.getGames(true, true, false);
    const gameId = Number(req.body.gameId);
    const newStatus = req.body.gameStatus;

    const game = games.filter(g => g.id === gameId)[0];
    if (!game) {
      console.log(`enableGame: Game ${gameId} not found`);
      res.redirect('/zkadmin.html?' + req.body.password);
      return;
    }

    await engines.sqlite.toggleGame(gameId, newStatus);
    console.log(`ENABLE GAME: ${gameId} -> ${newStatus}`);
    res.redirect('/zkadmin.html?' + req.body.password);
  } catch(e) {
    res.status(500).send(
      makeError('/api/game/list', req.body, e));
  }
});

console.log('TODO: проверка денег');
console.log('TODO: список замен');
// удаление себя из записавшихся без денег
// переключение в режим можно платить

app.listen(config.server.port);
console.log(`SERVER --- listen on: ${config.server.port}`);

// listen for events new from baskmsk system
// smtpEvents.addHandler(async (data) => {
//   let bookInfo = utils.findBookInfoInMailText(data);
//   if (!bookInfo) {
//     printError('Some shit with mail event');
//     return;
//   }
//   let game = await engines.sqlite.getGame(bookInfo.gameId);
//   if (!game) {
//     printError('Some shit with game/mailer settings', game);
//     return;
//   }

//   let players = await engines.basketmsk.getPlayers(game.id);
//   let freeSlots = game.maxPlayers - players.length;
//   bot.send('channel', `${bookInfo.name} записался на игру ${game.date}\r\nСвободных мест: ${freeSlots}, запись на basket.msk.ru`);
// });

function makeError(msg) {
  printError.apply(this, arguments);
  return {
    error: msg
  };
}

function printError(msg) {
  bot.send('owner', `Error: ${msg}`);
  let args = [];
  for (let key in arguments) {
    args.push(arguments[key]);
  }
  args.unshift('Error:');
  console.log.apply(this, args);
}


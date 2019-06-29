const utils = require('../utils/misc');
const { Game, GameDetails, GameSlot, Place, User } = require('./types');

let log;
let execSQL;
const getGame = async (gameId) => {
  const games = await execSQL.all(`SELECT g.*, usedPlayerSlots FROM games g
    LEFT JOIN (
      SELECT gameId, count(*) usedPlayerSlots from bookings
      WHERE status IN ('booked', 'reserved')
      AND gameId = ${gameId}
      GROUP BY gameId
    ) bk ON g.gameId = bk.gameId
    WHERE g.gameId = ${gameId}`
  );
  if (games.length !== 1) {
    throw new Error(`getGame(): cannot find game with gameId:${gameId}`);
  }

  const game = games[0];
  const place = (await getPlaces([game.placeId]))[0];
  const organizer = (await getUsers([game.organizerId]))[0];

  return new Game({
      ...game,
      place,
      organizer,
    });
  }

const getGameDetails = async (game) => {
  const allBookings = await execSQL.all(`SELECT * FROM bookings 
    WHERE gameId = ${game.gameId}`
  );
  const players = allBookings.filter(b => ['reserved', 'booked'].indexOf(b.status) > -1);
  const waiters = allBookings.filter(b => b.status == 'waiting');

  return new GameDetails(
    game,
    players.map(pl => ({ ...pl, type: 'player'})).map(pl => new GameSlot(pl)),
    waiters.map(wt => ({ ...wt, type: 'waiter'})).map(wt => new GameSlot(wt)),
  );
  return gameDetails;
};

const getPlaces = async (placeIds) => {
  const places = await execSQL.all(`SELECT * FROM places
    WHERE placeId IN (${placeIds.join()})`);
  return places.map(p => new Place(p));
};

const getUsers = async (usersIds) => {
  const users = await execSQL.all(`SELECT * FROM users
    WHERE userId IN (${usersIds.join()})`);
  return users.map(u => new User(u));
};


const getGamesList = async (props = {}) => {
  const today = utils.getStartOfTheDate();
  if (props.showLastMonth) {
    today.setHours(-24*30);
  }

  let games = await execSQL.all(`SELECT g.*, usedPlayerSlots FROM games g
    LEFT JOIN (
      SELECT gameId, count(*) usedPlayerSlots from bookings
      WHERE status IN ('booked', 'reserved')
      GROUP BY gameId
    ) bk ON g.gameId = bk.gameId
    WHERE date >= "${today.toJSON().slice(0,10)}"
    ORDER BY date ASC`);

  const organizerIds = Object.keys(games.reduce((acc, val) => {
    acc[val.organizerId] = true;
    return acc;
  }, {}));

  const placeIds = Object.keys(games.reduce((acc, val) => {
    acc[val.placeId] = true;
    return acc;
  }, {}));

  const places = await getPlaces(placeIds);
  const organizers = await getUsers(organizerIds);

  if (!props.showDisabled) {
    games = games.filter(g => g.status !== 'disabled');
  }

  return games.map(game => new Game({
    ...game,
    place: places.filter(p => p.placeId === game.placeId).pop(),
    organizer: organizers.filter(o => o.userId == game.organizerId).pop(),
  }));
};

module.exports = {
  init: (driver) => {
    if (!driver) { throw `${__filename}: undefined DAL driver`; }

    execSQL = driver.methods;
    log = driver.dalLog;

    return {
      getGamesList,
      getGame,
      getGameDetails,
    };
  }
};

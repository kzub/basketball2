const utils = require('../utils/misc');

let log;
let execSQL;

const getGames = async (showLastMonth = false, rawData = false, hideDisabled = true) => {

  if (showLastMonth) {
    today.setDate(-30);
  }

  let games = await dbSelect('SELECT g.id as gid, p.id as placeId, * FROM games g LEFT JOIN places p ON g.placeId = p.id ' +
    `WHERE date >= ${today.valueOf()} ORDER BY date ASC`);

  if (hideDisabled) {
    games = games.filter(g => g.enabled);
  }

  return games.map(game => gameMapper(game, rawData));
};

const getGamesList = async (props = {}) => {
  const today = utils.getStartOfTheDate();
  if (props.showLastMonth) {
    today.setDate(-30);
  }

  let games = await execSQL.all(`SELECT * FROM games g 
    LEFT JOIN places p ON g.placeId = p.placeId 
    LEFT JOIN (Select gameId, count(*) booked from bookings WHERE status='booked' GROUP BY gameId) bk ON g.gameId = bk.gameId
    LEFT JOIN (Select gameId, count(*) reserved from bookings WHERE status='reserved' GROUP BY gameId) rsv ON g.gameId = rsv.gameId
    WHERE date >= ${today.valueOf()} 
    ORDER BY date ASC`);

  if (props.hideDisabled) {
    games = games.filter(g => g.status !== 'disabled');
  }

  log.info(games);
  return games;//.map(game => gameMapper(game, rawData));
};

module.exports = { 
  init: (driver) => { 
    if (!driver) { throw `${__filename}: undefined DAL driver`; }
    execSQL = driver.methods;
    log = driver.dalLog
    return {
      getGamesList,
    };
  }
};

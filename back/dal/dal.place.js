const { Place, Organizer } = require('./types');

let log; // eslint-disable-line
let dal; // eslint-disable-line
let execSQL;

const getPlaces = async (placeIds) => {
  const places = await execSQL.all(`SELECT * FROM places
    WHERE placeId IN (${placeIds.join()})`);
  return places.map(p => new Place(p));
};

const getPlace = async (placeId) => {
  const place = await execSQL.all(`SELECT * FROM places
    WHERE placeId = ${placeId}`);
  return new Place(place[0]);
};

module.exports = {
  init: (driver, dalInstance) => {
    if (!driver) { throw new Error(`${__filename}: undefined DAL driver`); }

    execSQL = driver.methods;
    log = driver.dalLog;
    dal = dalInstance;

    return {
      getPlace,
      getPlaces,
    };
  }
};

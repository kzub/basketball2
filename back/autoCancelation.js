const bot = require('./telegram_bot');
const routines = {};
const timeout = 30*60*1000;

function makeId(gameId, playerId) {
  return [gameId, playerId].join(':');
}

function cancelWrapper(gameId, player, deleteMethod) {
  console.log('AUTO cancellation DELETE expired player book', gameId, player.id, player.firstName, player.surName);
  bot.send('zk', `Book expired: ${gameId}/${player.id} ${player.firstName} ${player.surName}`);
  deleteMethod(gameId, player.id);
}

exports.add = function(gameId, player, deleteMethod) {
  if (!(player instanceof Object) || !isFinite(gameId) || !(deleteMethod instanceof Function)) {
    console.log('autoCancelation: bad input parameters', gameId, player, deleteMethod);
    return;
  }

  let id = makeId(gameId, player.id);
  if (routines[id]) {
    clearTimeout(routines[id]);
  }

  routines[id] = setTimeout(cancelWrapper, timeout, gameId, player, deleteMethod);
  console.log(`AUTO cancellation ON for ${gameId}/${player.id} ${player.firstName} ${player.surName}`);
};

exports.del = function(gameId, player) {
  let id = makeId(gameId, player.id);
  if (routines[id]) {
    clearTimeout(routines[id]);
    delete routines[id];
    console.log(`AUTO cancellation OFF for ${gameId}/${player.id} ${player.firstName} ${player.surName}`);
  }
};


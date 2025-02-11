const utils = require('../utils/misc');
const { Game, GameDetails, Reservation } = require('./types');
const events = require('../utils/notifications');

let log; // eslint-disable-line
let dal; // eslint-disable-line
let execSQL;

const getGame = async (gameId) => {
  const games = await execSQL.all(`SELECT g.*, usedPlayerSlots, usedWaiterSlots, chatLink FROM games g
    LEFT JOIN (
      SELECT gameId, count(*) usedPlayerSlots from bookings
      WHERE status IN ('reserved')
      AND gameId = ${gameId}
      GROUP BY gameId
    ) bk ON g.gameId = bk.gameId
    LEFT JOIN (
      SELECT gameId, count(*) usedWaiterSlots from bookings
      WHERE status = 'waiting'
      AND gameId = ${gameId}
      GROUP BY gameId
    ) bkw ON g.gameId = bkw.gameId
    LEFT JOIN (
      SELECT notifyId, chatLink from notifications
    ) ntf ON g.notifyId = ntf.notifyId
    WHERE g.gameId = ${gameId}`
  );
  if (games.length !== 1) {
    throw new Error(`getGame(): cannot find game with gameId:${gameId}`);
  }

  const game = games[0];
  const place = await dal.place.getPlace(game.placeId);
  const organizer = await dal.user.getUser(game.organizerId);

  return new Game({
    ...game,
    place,
    organizer,
  });
};

const optionalText = (text) => {
  if (text === undefined || text === null) {
    return 'null';
  }
  return `'${text}'`;
};

const addGame = async (game) => {
  const res = await execSQL.run(`INSERT INTO games
    (placeId, notifyId, date, timeStart, timeEnd, organizerId, playerSlots, waiterSlots, status,
    paymentType, paymentAmount, paymentMessage, paymentGateAccount, paymentGateMessage, hoursBeforeGameRefundAllowed,
    openingMode, openingDate, openingTime)
    VALUES (${game.place.placeId}, ${game.notifyId}, '${game.date}', '${game.timeStart}',
    '${game.timeEnd}', ${game.organizer.userId}, ${game.playerSlots}, ${game.waiterSlots},
    '${game.status}', '${game.paymentType}', ${game.paymentAmount},
    ${optionalText(game.paymentMessage)},
    ${optionalText(game.paymentGateAccount)},
    ${optionalText(game.paymentGateMessage)},
    ${game.hoursBeforeGameRefundAllowed},
    '${game.openingMode}',
    ${optionalText(game.openingDate)},
    ${optionalText(game.openingTime)})
  `);

  return res && res.lastID;
};

const updateGameStatus = async (game) => {
  let sql = `UPDATE games SET status = '${game.status}', openingMode = '${game.openingMode}' WHERE gameId = ${game.gameId}`;
  const res = await execSQL.run(sql);
  return res && res.lastID;
};

const updateGameOpenMode = async (game) => {
  let sql = `UPDATE games SET openingMode = '${game.openingMode}' WHERE gameId = ${game.gameId}`;
  const res = await execSQL.run(sql);
  return res && res.lastID;
};

const getGameOrganizerId = async (gameId) => {
  const games = await execSQL.all(`SELECT organizerId FROM games
    WHERE games.gameId = ${gameId}`
  );
  if (games.length !== 1) {
    throw new Error(`getGameOrganizerId(): cannot find game with gameId:${gameId}`);
  }

  return games[0].organizerId;
};

const getGameNotifyId = async (gameId) => {
  const games = await execSQL.all(`SELECT notifyId FROM games
    WHERE games.gameId = ${gameId}`
  );
  if (games.length !== 1) {
    throw new Error(`getGameNotifyId(): cannot find game with gameId:${gameId}`);
  }

  return games[0].notifyId;
};


const getGameDetails = async (gameId) => {
  const game = await getGame(gameId);
  const allBookings = await execSQL.all(`SELECT * FROM bookings
    WHERE gameId = ${game.gameId}`
  );
  const players = allBookings.filter(b => ['reserved'].indexOf(b.status) > -1);
  const waiters = allBookings.filter(b => b.status == 'waiting');

  return new GameDetails(
    game,
    players.map(pl => new Reservation(pl)),
    waiters.map(wt => new Reservation(wt)),
  );
};

const getGamesList = async (props = {}) => {
  const today = utils.getLocalTime().toJSON().slice(0, 10);
  let condition = `date >= "${today}"`;
  let order = 'date ASC, timeStart ASC';

  if (props.organizerId) {
    condition = `organizerId = ${props.organizerId}`;
    order = 'date DESC, timeStart DESC LIMIT 5';
  }

  if (props.autoOpen) {
    condition = `status = "disabled" AND openingMode = "auto" AND openingDate <= "${today}"`;
    order = 'date ASC, timeStart ASC';
  }

  let games = await execSQL.all(`SELECT g.*, usedPlayerSlots, usedWaiterSlots, chatLink FROM games g
    LEFT JOIN (
      SELECT gameId, count(*) usedPlayerSlots from bookings
      WHERE status IN ('reserved')
      GROUP BY gameId
    ) bk ON g.gameId = bk.gameId
    LEFT JOIN (
      SELECT gameId, count(*) usedWaiterSlots from bookings
      WHERE status = 'waiting'
      GROUP BY gameId
    ) bkw ON g.gameId = bkw.gameId
    LEFT JOIN (
      SELECT notifyId, chatLink from notifications
    ) ntf ON g.notifyId = ntf.notifyId
    WHERE ${condition}
    ORDER BY ${order}`);

  const organizerIds = Object.keys(games.reduce((acc, val) => {
    acc[val.organizerId] = true;
    return acc;
  }, {}));

  const placeIds = Object.keys(games.reduce((acc, val) => {
    acc[val.placeId] = true;
    return acc;
  }, {}));

  const places = await dal.place.getPlaces(placeIds);
  const organizers = await dal.user.getUsers(organizerIds);

  return games.map(game => new Game({
    ...game,
    place: places.filter(p => p.placeId === game.placeId).pop(),
    organizer: organizers.filter(o => o.userId == game.organizerId).pop(),
  }));
};

const moveWaiters = async (game) => {
  const bookIds = await execSQL.all(`SELECT bookId from bookings
    WHERE status = 'waiting'
    AND gameId = ${game.gameId}
    ORDER by ts
    LIMIT 1`);

  if (bookIds.length == 0) {
    return {};
  }

  // always set expire time as waiterReservationTTL, because previuos reservation has expire time,
  // so new one must be the same
  const ttl = game.waiterReservationTTL();
  const promotedRsvId = bookIds[0].bookId;

  const res = await execSQL.run(`UPDATE bookings SET status = 'reserved', expireAt = ${ttl}
    WHERE bookId = ${promotedRsvId} AND
    (SELECT playerSlots from games WHERE gameId = ${game.gameId}) -
    (SELECT count(*) from bookings WHERE status IN ('reserved') AND gameId = ${game.gameId}) = 1`);
    // если игра не полная, а есть отмена, не нужно записывать ожидающего в играющего
    // он это может сделать и сам

  if (!res || res.changes !== 1) {
    return {};
  }

  const promotedRsv = await dal.reservation.get(game.gameId, promotedRsvId);
  let refundAmount;

  if (game.isPrepay() && !game.isStarted()) {
    const credits = await dal.payment.getUserCreditsForOrganizerId(promotedRsv.userId, game.organizer.userId);
    if (credits && credits.total >= game.paymentAmount) {
      // userId, organizerId, amount, sourceType, sourceId = null, comment = null
      const creditTransId = await dal.payment.addCreditTransaction(
        promotedRsv.userId, game.organizer.userId, -game.paymentAmount, 'reservation.pay', promotedRsv.bookId, 'waiter.promouted'
      );

      // recipientId, paySystem, amount, gameId, bookId, userId, rawData
      const paymentId = await dal.payment.addTransaction(
        game.organizer.userId, 'credits', game.paymentAmount, game.gameId, promotedRsv.bookId, promotedRsv.userId, {
          creditTransactionId: creditTransId,
          reason: 'waiter promouted',
        }
      );

      promotedRsv.makePaid(game.paymentAmount);
      promotedRsv.setExpire(0);
      promotedRsv.paymentId = paymentId;
      const ok = await dal.reservation.update(promotedRsv);
      if (!ok) {
        log.error(`moveWaiters() error, ok: ${ok}`);
        return {};
      }

      // refund previous player with canceled reservation if there are any of them
      const rsvs = await dal.game.getNotRefundedCanceledReservations(game.gameId);
      if (rsvs.length) {
        const reservation = rsvs[0];
        log.info(`moveWaiters(), new payment will cause refund for ${reservation.gameId}/${reservation.bookId}`);
        refundAmount = reservation.paymentAmount;
        await dal.payment.addCreditTransaction(reservation.userId, game.organizer.userId, refundAmount, 'reservation.cancel', reservation.bookId, 'refund transfered from new player with autopay by credits');
        events.emit('user.credits.added', {
          gameId: game.gameId,
          playerName: reservation.playerName,
          receiverName: game.organizer.name,
          amount: refundAmount,
        });
      }
    }
  }

  return { promotedRsv, refundAmount };
};

const getNotRefundedCanceledReservations = async (gameId) => {
  const rsvs = await execSQL.all(`SELECT canceledRsvs.* FROM
    (SELECT * FROM bookings WHERE
      gameId = ${gameId}
      AND paymentStatus = 'paid'
      AND paymentId  > 0
      AND status = 'canceled'
    ) canceledRsvs
    LEFT JOIN credits ON
      canceledRsvs.userId = credits.userId
      AND credits.sourceType = 'reservation.cancel'
      AND canceledRsvs.bookId = credits.sourceId
    WHERE
     credits.amount IS NULL
    ORDER BY ts`
  );
  return rsvs.map(rsv => new Reservation(rsv));
};

const getPayedReservationsNumber = async (gameId) => {
  const result = await execSQL.all(`SELECT count(*) cnt FROM bookings WHERE
    gameId = ${gameId}
    AND paymentStatus = 'paid'
    AND status = 'reserved'
  `);
  return result[0].cnt;
};

module.exports = {
  init: (driver, dalInstance) => {
    if (!driver) { throw new Error(`${__filename}: undefined DAL driver`); }

    execSQL = driver.methods;
    log = driver.dalLog;
    dal = dalInstance;

    return {
      addGame,
      getGame,
      getGameDetails,
      getGameNotifyId,
      getGameOrganizerId,
      getGamesList,
      getNotRefundedCanceledReservations,
      getPayedReservationsNumber,
      moveWaiters,
      updateGameOpenMode,
      updateGameStatus,
    };
  }
};

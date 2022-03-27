const apiError = (state, p) => state.apiError = p
const freePayment = (state, p) => state.freePayment = p
const freePaymentList = (state, p) => state.freePaymentList = p
const gameDetails = (state, p) => state.gameDetails = p
const games = (state, p) => state.games = p
const myGamesOnly = (state, p) => state.myGamesOnly = p
const newGameOptions = (state, p) => state.newGameOptions = p
const returnInfo = (state, p) => state.returnInfo = { ...state.returnInfo, ...p }
const setReservationExpire = (state, p) => state.reservationExpire = p
const user = (state, p) => state.user = p
const userName = (state, p) => state.user.name = p
const creditors = (state, p) => state.creditors = p
const creditorsReduce = (state, p) => {
  state.creditors.creditorsList.map(c => {
    if (c.userId == p.userId) {
      c.total -= p.amount
    }
  })
}
const rsvTransferCode = (state, p) => state.rsvTransferCode = p && p.transferCode
const setUpdatedFlag = (state, p) => {
  console.log('setUpdatedFlag', p) // eslint-disable-line no-console
  if (typeof p !== 'boolean') {
    throw `setUpdatedFlag should use boolean, currently: ${typeof(p)}`
  }
  state.viewDataUpdated = p
}
const gamesStats = (state, p) => state.gamesStats = p

export default {
  apiError,
  creditors,
  creditorsReduce,
  freePayment,
  freePaymentList,
  gameDetails,
  games,
  gamesStats,
  myGamesOnly,
  newGameOptions,
  returnInfo,
  rsvTransferCode,
  setReservationExpire,
  setUpdatedFlag,
  user,
  userName,
}

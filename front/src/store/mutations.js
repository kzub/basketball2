const freePayment = (state, p) => state.freePayment = p
const freePaymentList = (state, p) => state.freePaymentList = p
const gameDetails = (state, p) => state.gameDetails = p
const games = (state, p) => state.games = p
const myGamesOnly = (state, p) => state.myGamesOnly = p
const newGameOptions = (state, p) => state.newGameOptions = p
const reservationDetails = (state, p) => state.reservationDetails = p
const returnInfo = (state, p) => state.returnInfo = { ...state.returnInfo, ...p }
const setReservationExpire = (state, p) => state.reservationExpire = p
const user = (state, p) => state.user = p
const userName = (state, p) => state.user.name = p
const creditors = (state, p) => state.creditors = p

const setUpdatedFlag = (state, p) => {
  if (typeof p !== 'boolean') {
    throw `setUpdatedFlag should use boolean, currently: ${typeof(p)}`
  }
  state.viewDataUpdated = p
}

export default {
  creditors,
  freePayment,
  freePaymentList,
  gameDetails,
  games,
  myGamesOnly,
  newGameOptions,
  reservationDetails,
  returnInfo,
  setReservationExpire,
  setUpdatedFlag,
  user,
  userName,
}

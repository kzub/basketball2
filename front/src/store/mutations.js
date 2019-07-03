import axios from 'axios'

const gameDetails = (state, p) => state.gameDetails = p
const games = (state, p) => state.games = p
const reservationDetails = (state, p) => state.reservationDetails = p
const returnInfo = (state, p) => state.returnInfo = { ...state.returnInfo, ...p }
const setReservationExpire = (state, p) => state.reservationExpire = p
const user = (state, p) => state.user = p

const setUpdatedFlag = (state, p) => {
  if (typeof p !== 'boolean') {
    throw `setUpdatedFlag should use boolean, currently: ${typeof(p)}`
  }
  state.viewDataUpdated = p
}

export default {
  gameDetails,
  games,
  reservationDetails,
  returnInfo,
  setReservationExpire,
  setUpdatedFlag,
  user,
}

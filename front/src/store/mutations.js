import axios from 'axios'

const user = (state, p) => state.user = p
const games = (state, p) => state.games = p
const gameDetails = (state, p) => state.gameDetails = p

const returnInfo = (state, p) => state.returnInfo = { ...state.returnInfo, ...p }

const setUpdatedFlag = (state, p) => {
  if (typeof p !== 'boolean') {
    throw `setUpdatedFlag should use boolean, currently: ${typeof(p)}`
  }
  state.viewDataUpdated = p
}

export default {
  user,
  games,
  gameDetails,
  returnInfo,
  setUpdatedFlag,
}

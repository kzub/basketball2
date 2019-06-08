import axios from 'axios'

const user = (state, p) => state.user = p

const games = (state, p) => state.games = p

const game = (state, gameId, p) => {
  let game = state.games.filter(game => game.gameId === gameId)
  if (game.length !== 1) {
    throw `mutations::game cannot find game ${gameId} in state.games`
  }
  game[0] = p;
}

const returnInfo = (state, p) => state.returnInfo = {...state.returnInfo, ...p}

const setUpdatedFlag = (state, p) => {
  if (typeof p !== 'boolean') {
    throw `setUpdatedFlag should use boolean, currently: ${typeof(p)}`
  }
  state.updated = p
}

export default {
  user,
  games,
  game,
  returnInfo,
  setUpdatedFlag,
}

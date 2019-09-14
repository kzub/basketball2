import axios from 'axios'

const bookSlot = ({ state }, bookInfo) => {
  console.log('actions::bookSlot', bookInfo)
  return axios.post(`/api/reservation/book?userId=${state.user.userId}&gameId=${bookInfo.gameId}`, { ...bookInfo })
  .then((result) => {
    console.log('/api/book result:', result.data)
    return result.data
  }).catch(err => {
    console.log('woho err:', err.message)
  })
}

const updateReservationName = ({ commit }, { gameId, bookId, name }) => {
  console.log('actions::updateReservationName', gameId, bookId, name)
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/reservation/setPlayer/${gameId}/${bookId}/${name}`)
    .then(response => {
      console.log('/api/reservation/setPlayer response:', response.data)
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/reservation/setPlayer error:', error)
      commit('setUpdatedFlag', true)
    })
}

const changeReservationPay = ({ commit, state }, { gameId, bookId }) => {
  console.log('actions::changeReservationPay', gameId, bookId, name)
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/reservation/changePay/${gameId}/${bookId}`)
    .then(response => {
      console.log('/api/reservation/changePay response:', response.data)
      return updateGameData({ commit, state }, gameId)
      // commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/reservation/changePay error:', error)
      commit('setUpdatedFlag', true)
    })
}

const clearReservationExpire = ({ commit, state }, { gameId, bookId }) => {
  console.log('actions::clearReservationExpire', gameId, bookId, name)
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/reservation/clearExpire/${gameId}/${bookId}`)
    .then(response => {
      console.log('/api/reservation/clearExpire response:', response.data)
      return updateGameData({ commit, state }, gameId)
      // commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/reservation/clearExpire error:', error)
      commit('setUpdatedFlag', true)
    })
}

const deleteReservation = ({ commit }, { gameId, bookId }) => {
  console.log('actions::deleteReservation', gameId, bookId)
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/reservation/cancel/${gameId}/${bookId}`)
    .then(response => {
      console.log('/api/reservation/cancel response:', response.data)
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/reservation/cancel error:', error)
      commit('setUpdatedFlag', true)
    })
}

const updateGamesData = ({ commit }, params) => {
  console.log('actions::updateGamesData', params)
  const myGamesOnly = params && params.showMyGames
  let gamesUrl = '/api/games'

  if (myGamesOnly) {
    gamesUrl += '/my'
  }
  commit('myGamesOnly', myGamesOnly)
  commit('setUpdatedFlag', false)
  return axios
    .get(gamesUrl)
    .then(response => {
      console.log('/api/games response:', response.data)
      commit('games', response.data)
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/games error:', error)
      commit('games', [])
      commit('setUpdatedFlag', true)
    })
}

const updateFreePaymentInfo = ({ commit }, params) => {
  console.log('actions::updateFreePaymentInfo', params)
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/payment/getOrganizerYM/${params.organizerId}/${params.account}`)
    .then(response => {
      console.log(`/api/payment/getOrganizerYM/${params.organizerId}/${params.account} response:`, response.data)
      commit('freePayment', response.data)
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log(`/api/payment/getOrganizerYM/${params.organizerId}/${params.account} error:`, error)
      commit('freePayment', undefined)
      commit('setUpdatedFlag', true)
    })
}

const updateFreePaymentList = ({ commit }) => {
  console.log('actions::updateFreePaymentList')
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/payment/getAllOrganizerYMs`)
    .then(response => {
      console.log(`/api/payment/getAllOrganizerYMs response:`, response.data)
      commit('freePaymentList', response.data)
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log(`/api/payment/getAllOrganizerYMs error:`, error)
      commit('freePaymentList', undefined)
      commit('setUpdatedFlag', true)
    })
}

const updateGameData = ({ commit }, gameId) => {
  console.log('actions::updateGameData', gameId)
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/game/details/${gameId}`)
    .then(response => {
      console.log(`/api/game/details/${gameId} response:`, response.data)
      commit('gameDetails', response.data)
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log(`/api/game/details/${gameId} error:`, error)
      commit('gameDetails', undefined)
      commit('setUpdatedFlag', true)
    })
}

const addGame = ({ commit }, options) => {
  console.log('actions::addGame', options)
  commit('setUpdatedFlag', false)
  return axios
    .post(`/api/game/add/`, options)
    .then(response => {
      console.log(`/api/game/add response:`, response.data)
      commit('setUpdatedFlag', true)
      return response.data
    })
    .catch(error => {
      console.log('/api/game/add error:', error)
      commit('setUpdatedFlag', true)
    })
}

const getNewGameOptions = ({ commit }) => {
  console.log('actions::getNewGameOptions')
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/game/options`)
    .then(response => {
      console.log(`/api/game/options response:`, response.data)
      commit('newGameOptions', response.data)
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/games error:', error)
      commit('newGameOptions', undefined)
      commit('setUpdatedFlag', true)
    })
}


const changeGameStatus = ({ commit }, { gameId, status }) => {
  console.log('actions::changeGameStatus', gameId)
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/game/changeStatus/${gameId}/${status}`)
    .then(response => {
      console.log(`/api/game/changeStatus/${gameId}/${status} response:`, response.data)
      commit('gameDetails', response.data)
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/game/changeStatus/${gameId}/${status} error:', error)
      commit('gameDetails', undefined)
      commit('setUpdatedFlag', true)
    })
}

const sendPlayersList = ({ commit }, { gameId }) => {
  console.log('actions::sendPlayersList', gameId)
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/game/sendPlayerList/${gameId}`)
    .then(response => {
      console.log(`/api/game/sendPlayerList/${gameId} response:`, response.data)
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/game/sendPlayerList/${gameId} error:', error)
      commit('setUpdatedFlag', true)
    })
}

const getUserInfo = ({ commit }) => {
  console.log('actions::getUserInfo')
  return axios
    .get(`/api/user/get`)
    .then(response => {
      console.log('/api/user/get response:', response.data)
      commit('user', response.data)
      return response.data
    })
    .catch(error => {
      commit('user', { auth: false })
      console.log('/api/user/get error:', error)
    })
}

const sendCheckCode = ({ state }, phone) => {
  console.log(`actions::sendCheckCode ${phone}`)
  return axios
    .get(`/api/user/sendCheckCode/${phone}`)
    .then(response => {
      console.log('/api/user/sendCheckCode response:', response.data)
      return response.data
    })
    .catch(error => {
      console.log('/api/user/sendCheckCode error:', error)
    })
}

const authUser = ({ state }, { phone, code }) => {
  console.log(`actions::authUser ${phone} ${code}`)
  return axios
    .get(`/api/user/auth/${phone}/${code}`)
    .then(response => {
      console.log('/api/user/auth response:', response.data)
      return response.data
    })
    .catch(error => {
      console.log('/api/user/auth error:', error)
    })
}

const exitUser = ({ commit }) => {
  console.log(`actions::exitUser`)
  return axios
    .get(`/api/user/exit`)
    .then(response => {
      console.log('/api/user/exit response:', response.data)
      commit('user', { auth: false })
    })
    .catch(error => {
      console.log('/api/user/exit error:', error)
    })
}

const setUserName = ({ commit }, name) => {
  console.log(`actions::setUserName ${name}`)
  return axios
    .get(`/api/user/set/${name}`)
    .then(response => {
      console.log('/api/user/set response:', response.data)
      if (response.data.ok) {
        commit('userName', name)
      }
      return response.data
    })
    .catch(error => {
      console.log('/api/user/set error:', error)
    })
}


const init = ({ dispatch }) => {
  console.log('actions::init')
  dispatch('getUserInfo')
  // .then(dispatch('updateGamesData'))
}

export default {
  addGame,
  authUser,
  bookSlot,
  changeGameStatus,
  deleteReservation,
  exitUser,
  getNewGameOptions,
  getUserInfo,
  init,
  sendCheckCode,
  sendPlayersList,
  clearReservationExpire,
  changeReservationPay,
  setUserName,
  updateFreePaymentInfo,
  updateFreePaymentList,
  updateGameData,
  updateGamesData,
  updateReservationName,
}
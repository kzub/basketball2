import axios from 'axios'

const bookSlot = ({ state }, bookInfo) => {
  console.log('actions::bookSlot', bookInfo)  // eslint-disable-line
  return axios.post(`/api/reservation/book?userId=${state.user.userId}&gameId=${bookInfo.gameId}`, { ...bookInfo })
  .then((result) => {
    console.log('/api/book result:', result.data)  // eslint-disable-line
    return result.data
  }).catch(err => {
    console.log('woho err:', err.message)  // eslint-disable-line
  })
}

const updateReservationName = ({ commit }, { gameId, bookId, name }) => {
  console.log('actions::updateReservationName', gameId, bookId, name) // eslint-disable-line no-console
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/reservation/setPlayer/${gameId}/${bookId}/${name}`)
    .then(response => {
      console.log('/api/reservation/setPlayer response:', response.data)  // eslint-disable-line
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/reservation/setPlayer error:', error)  // eslint-disable-line
      commit('setUpdatedFlag', true)
    })
}

const changeReservationPay = ({ commit, state }, { gameId, bookId }) => {
  console.log('actions::changeReservationPay', gameId, bookId)  // eslint-disable-line no-console
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/reservation/changePay/${gameId}/${bookId}`)
    .then(response => {
      console.log('/api/reservation/changePay response:', response.data)  // eslint-disable-line
      return updateGameData({ commit, state }, gameId)
      // commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/reservation/changePay error:', error)  // eslint-disable-line
      commit('setUpdatedFlag', true)
    })
}

const payByCredits = ({ commit, state }, { gameId, bookId }) => {
  console.log('actions::payByCredits', gameId, bookId)  // eslint-disable-line
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/reservation/payByCredits/${gameId}/${bookId}`)
    .then(response => {
      console.log('/api/reservation/payByCredits response:', response.data)  // eslint-disable-line
      return getUserInfo({ commit }) // update credits data
    })
    .then(() => {
      return updateGameData({ commit, state }, gameId)
    })
    .catch(error => {
      console.log('/api/reservation/payByCredits error:', error)  // eslint-disable-line
      commit('setUpdatedFlag', true)
    })
}

const clearReservationExpire = ({ commit, state }, { gameId, bookId }) => {
  console.log('actions::clearReservationExpire', gameId, bookId)  // eslint-disable-line
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/reservation/clearExpire/${gameId}/${bookId}`)
    .then(response => {
      console.log('/api/reservation/clearExpire response:', response.data)  // eslint-disable-line
      return updateGameData({ commit, state }, gameId)
      // commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/reservation/clearExpire error:', error)  // eslint-disable-line
      commit('setUpdatedFlag', true)
    })
}

const deleteReservation = ({ commit }, { gameId, bookId }) => {
  console.log('actions::deleteReservation', gameId, bookId)  // eslint-disable-line
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/reservation/cancel/${gameId}/${bookId}`)
    .then(response => {
      console.log('/api/reservation/cancel response:', response.data)  // eslint-disable-line
      commit('setUpdatedFlag', true)
      return response.data
    })
    .catch(error => {
      console.log('/api/reservation/cancel error:', error)  // eslint-disable-line
      commit('setUpdatedFlag', true)
    })
}

const updateGamesData = ({ commit }, params) => {
  console.log('actions::updateGamesData', params)  // eslint-disable-line
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
      console.log('/api/games response:', response.data)  // eslint-disable-line
      commit('games', response.data)
      commit('setUpdatedFlag', true)
      return response.data
    })
    .catch(error => {
      console.log('/api/games error:', error)  // eslint-disable-line
      commit('games', [])
      commit('apiError', true)
      commit('setUpdatedFlag', true)
    })
}

const updateFreePaymentInfo = ({ commit }, params) => {
  console.log('actions::updateFreePaymentInfo', params)  // eslint-disable-line
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/payment/getOrganizerYM/${params.organizerId}/${params.account}`)
    .then(response => {
      console.log(`/api/payment/getOrganizerYM/${params.organizerId}/${params.account} response:`, response.data)  // eslint-disable-line
      commit('freePayment', response.data)
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log(`/api/payment/getOrganizerYM/${params.organizerId}/${params.account} error:`, error)  // eslint-disable-line
      commit('freePayment', undefined)
      commit('setUpdatedFlag', true)
    })
}

const updateFreePaymentLinks = ({ commit }) => {
  console.log('actions::updateFreePaymentLinks')  // eslint-disable-line
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/payment/getAllOrganizerYMs`)
    .then(response => {
      console.log(`/api/payment/getAllOrganizerYMs response:`, response.data)  // eslint-disable-line
      commit('freePaymentList', response.data)
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log(`/api/payment/getAllOrganizerYMs error:`, error)  // eslint-disable-line
      commit('freePaymentList', undefined)
      commit('setUpdatedFlag', true)
    })
}

const updateGameData = ({ commit }, gameId) => {
  console.log('actions::updateGameData', gameId)  // eslint-disable-line
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/game/details/${gameId}`)
    .then(response => {
      console.log(`/api/game/details/${gameId} response:`, response.data)  // eslint-disable-line
      commit('gameDetails', response.data)
      commit('setUpdatedFlag', true)
      return response.data
    })
    .catch(error => {
      console.log(`/api/game/details/${gameId} error:`, error)  // eslint-disable-line
      commit('gameDetails', undefined)
      commit('apiError', true)
      commit('setUpdatedFlag', true)
    })
}

const addGame = ({ commit }, options) => {
  console.log('actions::addGame', options)  // eslint-disable-line
  commit('setUpdatedFlag', false)
  return axios
    .post(`/api/game/add/`, options)
    .then(response => {
      console.log(`/api/game/add response:`, response.data)  // eslint-disable-line
      commit('setUpdatedFlag', true)
      return response.data
    })
    .catch(error => {
      console.log('/api/game/add error:', error)  // eslint-disable-line
      commit('setUpdatedFlag', true)
      return {
        error: true,
        data: error.response.data,
        statusCode: error.response.status,
      }
    })
}

const getNewGameOptions = ({ commit }) => {
  console.log('actions::getNewGameOptions')  // eslint-disable-line
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/game/options`)
    .then(response => {
      console.log(`/api/game/options response:`, response.data)  // eslint-disable-line
      commit('newGameOptions', response.data)
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/games error:', error)  // eslint-disable-line
      commit('newGameOptions', undefined)
      commit('setUpdatedFlag', true)
    })
}

const getTransferCode = ({ commit }, { gameId, bookId }) => {
  console.log('actions::getTransferCode')  // eslint-disable-line
  return axios
    .get(`/api/reservation/getTransferCode/${gameId}/${bookId}`)
    .then(response => {
      console.log(`/api/reservation/getTransferCode/${gameId}/${bookId}`, response.data)  // eslint-disable-line
      commit('rsvTransferCode', response.data)
    })
    .catch(error => {
      console.log(`/api/reservation/getTransferCode/${gameId}/${bookId} error:`, error)  // eslint-disable-line
      commit('rsvTransferCode', undefined)
    })
}

const getTransferDetails = ({ commit }, { rsvTransferCode }) => {
  console.log('actions::getTransferDetails')  // eslint-disable-line
  return axios
    .get(`/api/reservation/getTransferDetails/${rsvTransferCode}`)
    .then(response => {
      console.log(`/api/reservation/getTransferDetails/${rsvTransferCode}`, response.data)  // eslint-disable-line
      commit('gameDetails', response.data.gameDetails)
      return response.data.transferDetails
    })
    .catch(error => {
      console.log(`/api/reservation/getTransferDetails/${rsvTransferCode} error:`, error)  // eslint-disable-line
      commit('gameDetails', undefined)
    })
}

const doTransfer = (store, { rsvTransferCode }) => {
  console.log('actions::doTransfer')  // eslint-disable-line
  return axios
    .get(`/api/reservation/doTransfer/${rsvTransferCode}`)
    .then(response => {
      console.log(`/api/reservation/doTransfer/${rsvTransferCode}`, response.data)  // eslint-disable-line
      return response.data
    })
    .catch(error => {
      console.log(`/api/reservation/doTransfer/${rsvTransferCode} error:`, error)  // eslint-disable-line
      return
    })
}

const changeGameStatus = ({ commit }, { gameId, status }) => {
  console.log('actions::changeGameStatus', gameId)  // eslint-disable-line
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/game/changeStatus/${gameId}/${status}`)
    .then(response => {
      console.log(`/api/game/changeStatus/${gameId}/${status} response:`, response.data)  // eslint-disable-line
      commit('gameDetails', response.data)
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/game/changeStatus/${gameId}/${status} error:', error)  // eslint-disable-line
      commit('gameDetails', undefined)
      commit('setUpdatedFlag', true)
    })
}

const sendPlayersList = ({ commit }, { gameId }) => {
  console.log('actions::sendPlayersList', gameId)  // eslint-disable-line
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/game/sendPlayerList/${gameId}`)
    .then(response => {
      console.log(`/api/game/sendPlayerList/${gameId} response:`, response.data)  // eslint-disable-line
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/game/sendPlayerList/${gameId} error:', error)  // eslint-disable-line
      commit('setUpdatedFlag', true)
    })
}

const askToPay = ({ commit }, { gameId }) => {
  console.log('actions::askToPay', gameId)  // eslint-disable-line
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/game/askToPay/${gameId}`)
    .then(response => {
      console.log(`/api/game/askToPay/${gameId} response:`, response.data)  // eslint-disable-line
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/game/askToPay/${gameId} error:', error)  // eslint-disable-line
      commit('setUpdatedFlag', true)
    })
}

const disableAutoOpen = ({ commit }, { gameId }) => {
  console.log('actions::disableAutoOpen', gameId)  // eslint-disable-line
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/game/disableAutoOpen/${gameId}`)
    .then(response => {
      console.log(`/api/game/disableAutoOpen/${gameId} response:`, response.data)  // eslint-disable-line
      commit('gameDetails', response.data)
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/game/disableAutoOpen/${gameId} error:', error)  // eslint-disable-line
      commit('setUpdatedFlag', true)
    })
}

const getUserInfo = ({ commit }) => {
  console.log('actions::getUserInfo')  // eslint-disable-line
  commit('setUpdatedFlag', false)
  commit('apiError', false)
  return axios
    .get(`/api/user/get`)
    .then(response => {
      console.log('/api/user/get response:', response.data)  // eslint-disable-line
      commit('user', response.data)
      commit('setUpdatedFlag', true)
      return response.data
    })
    .catch(error => {
      commit('user', { auth: false })
      commit('apiError', true)
      commit('setUpdatedFlag', true)
      console.log('/api/user/get error:', error)  // eslint-disable-line
    })
}

const sendCheckCode = (store, phone) => {
  console.log(`actions::sendCheckCode ${phone}`)  // eslint-disable-line
  // commit('setUpdatedFlag', false) не нужно - всё ломает в регистрации
  // потому что пока отправляется - удаляется форма и сохраненные данные
  return axios
    .get(`/api/user/sendCheckCode/${phone}`)
    .then(response => {
      console.log('/api/user/sendCheckCode response:', response.data)  // eslint-disable-line
      return response.data
    })
    .catch(error => {
      console.log('/api/user/sendCheckCode error:', error)  // eslint-disable-line
    })
}

const getLoginLink = ({commit}, phone) => {
  console.log(`actions::getLoginLink ${phone}`)  // eslint-disable-line
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/user/getLoginLinkByPhone/${phone}`)
    .then(response => {
      commit('setUpdatedFlag', true)
      console.log('/api/user/getLoginLinkByPhone response:', response.data)  // eslint-disable-line
      return response.data
    })
    .catch(error => {
      commit('setUpdatedFlag', true)
      console.log('/api/user/getLoginLinkByPhone error:', error)  // eslint-disable-line
    })
}

const authUser = (store, { phone, code }) => {
  console.log(`actions::authUser ${phone} ${code}`)  // eslint-disable-line
  // commit('setUpdatedFlag', false) не нужно - всё ломает в регистрации
  // потому что пока отправляется - удаляется форма и сохраненные данные
  return axios
    .get(`/api/user/auth/${phone}/${code}`)
    .then(response => {
      console.log('/api/user/auth response:', response.data)  // eslint-disable-line
      return response.data
    })
    .catch(error => {
      console.log('/api/user/auth error:', error)  // eslint-disable-line
    })
}

const exitUser = ({ commit }) => {
  console.log(`actions::exitUser`)  // eslint-disable-line
  return axios
    .get(`/api/user/exit`)
    .then(response => {
      console.log('/api/user/exit response:', response.data)  // eslint-disable-line
      commit('user', { auth: false })
    })
    .catch(error => {
      console.log('/api/user/exit error:', error)  // eslint-disable-line
    })
}

const setUserName = ({ commit }, name) => {
  console.log(`actions::setUserName ${name}`)  // eslint-disable-line
  return axios
    .get(`/api/user/set/${name}`)
    .then(response => {
      console.log('/api/user/set response:', response.data)  // eslint-disable-line
      if (response.data.ok) {
        commit('userName', name)
      }
      return response.data
    })
    .catch(error => {
      console.log('/api/user/set error:', error)  // eslint-disable-line
    })
}


const getCreditors = ({ commit }) => {
  console.log('actions::getCreditors')  // eslint-disable-line
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/payment/getCreditors`)
    .then(response => {
      console.log('/api/payment/getCreditors response:', response.data)  // eslint-disable-line
      commit('creditors', response.data)
      commit('setUpdatedFlag', true)
      return response.data
    })
    .catch(error => {
      commit('creditors', undefined)
      commit('setUpdatedFlag', true)
      console.log('/api/payment/getCreditors error:', error)  // eslint-disable-line
    })
}


const deleteDebt = ({ commit }, { userId }) => {
  console.log('actions::deleteDebt', userId)  // eslint-disable-line
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/payment/deleteDebt/${userId}`)
    .then(response => {
      if (response.data.ok) {
        commit('creditorsReduce', {
          amount: response.data.amount,
          userId,
        })
      }
      console.log(`/api/payment/deleteDebt/${userId} response:`, response.data)  // eslint-disable-line
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/payment/deleteDebt/${userId} error:', error)  // eslint-disable-line
      commit('setUpdatedFlag', true)
    })
}



const init = ({ dispatch }) => {
  console.log('actions::init')  // eslint-disable-line
  dispatch('getUserInfo')
}

export default {
  addGame,
  askToPay,
  authUser,
  bookSlot,
  changeGameStatus,
  changeReservationPay,
  clearReservationExpire,
  deleteDebt,
  deleteReservation,
  disableAutoOpen,
  doTransfer,
  exitUser,
  getCreditors,
  getLoginLink,
  getNewGameOptions,
  getTransferCode,
  getTransferDetails,
  getUserInfo,
  init,
  payByCredits,
  sendCheckCode,
  sendPlayersList,
  setUserName,
  updateFreePaymentInfo,
  updateFreePaymentLinks,
  updateGameData,
  updateGamesData,
  updateReservationName,
}
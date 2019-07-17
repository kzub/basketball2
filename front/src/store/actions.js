import axios from 'axios'

const bookSlot = ({ commit, state }, bookInfo) => {
  console.log('actions::bookSlot', bookInfo)
  return axios.post(`/api/reservation/book?userId=${state.user.userId}&gameId=${bookInfo.gameId}`, { ...bookInfo })
  .then((result) => {
    console.log('/api/book result:', result.data)
    // commit('bookSlot', result.data.bookId)
    return result.data
  }).catch(err => {
    console.log('woho err:', err.message)
  })
}

const updateReservationName = ({ commit, state }, { gameId, bookId, name }) => {
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

const updateReservationPay = ({ commit, state }, { gameId, bookId }) => {
  console.log('actions::updateReservationPay', gameId, bookId, name)
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/reservation/changePay/${gameId}/${bookId}`)
    .then(response => {
      console.log('/api/reservation/changePay response:', response.data)
      updateGameData({ commit, state }, gameId)
      // commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/reservation/changePay error:', error)
      commit('setUpdatedFlag', true)
    })
}

const deleteReservation = ({ commit, state }, { gameId, bookId }) => {
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


const updateGamesData = ({ commit, state }) => {
  console.log('actions::updateGamesData')
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/games`)
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

const updateGameData = ({ commit, state }, gameId) => {
  console.log('actions::updateGameData', gameId)
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/game/${gameId}`)
    .then(response => {
      console.log(`/api/game/${gameId} response:`, response.data)
      commit('gameDetails', response.data)
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/games error:', error)
      commit('gameDetails', undefined)
      commit('setUpdatedFlag', true)
    })
}

const getUserInfo = ({ commit, state }) => {
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

const sendCheckCode = ({ commit, state }, phone) => {
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

const authUser = ({ commit, state }, { phone, code }) => {
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

const exitUser = ({ commit, state }) => {
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

const setUserName = ({ commit, state }, name) => {
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


const init = ({ commit, state, dispatch }) => {
  console.log('actions::init')
  dispatch('getUserInfo')
  // .then(dispatch('updateGamesData'))
}

export default {
  bookSlot,
  updateGamesData,
  updateGameData,
  updateReservationName,
  updateReservationPay,
  deleteReservation,
  authUser,
  exitUser,
  getUserInfo,
  sendCheckCode,
  setUserName,
  init,
}
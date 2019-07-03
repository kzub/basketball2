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

const updateReservationData = ({ commit, state }, { gameId, bookId }) => {
  console.log('actions::updateReservationData', gameId, bookId)
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/reservation/${gameId}/${bookId}`)
    .then(response => {
      console.log('/api/reservation response:', response.data);
      commit('reservationDetails', response.data);
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/reservation error:', error);
      commit('reservationDetails', undefined);
      commit('setUpdatedFlag', true)
    });
}

const updateGamesData = ({ commit, state }) => {
  console.log('actions::updateGamesData')
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/games`)
    .then(response => {
      console.log('/api/games response:', response.data);
      commit('games', response.data);
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/games error:', error);
      commit('games', []);
      commit('setUpdatedFlag', true)
    });
};

const updateGameData = ({ commit, state }, gameId) => {
  console.log('actions::updateGameData', gameId)
  commit('setUpdatedFlag', false)
  return axios
    .get(`/api/game/${gameId}`)
    .then(response => {
      console.log(`/api/game/${gameId} response:`, response.data);
      commit('gameDetails', response.data);
      commit('setUpdatedFlag', true)
    })
    .catch(error => {
      console.log('/api/games error:', error);
      commit('gameDetails', undefined);
      commit('setUpdatedFlag', true)
    });
};

const getUserInfo = ({ commit, state }) => {
  console.log('actions::getUserInfo')
  return axios
    .get(`/api/user/get`)
    .then(response => {
      console.log('/api/user/get response:', response.data);
      commit('user', response.data)
    })
    .catch(error => {
      commit('user', { auth: false })
      console.log('/api/user/get error:', error);
    });
};

const init = ({ commit, state, dispatch }) => {
  console.log('actions::init')
  dispatch('getUserInfo')
  // .then(dispatch('updateGamesData'))
}

export default {
  bookSlot,
  updateGamesData,
  updateGameData,
  updateReservationData,
  getUserInfo,
  init,
}
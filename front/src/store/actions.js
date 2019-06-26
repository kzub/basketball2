import axios from 'axios'

const bookSlot = ({ commit, state }, bookInfo) => {
  console.log('actions::bookSlot', bookInfo)
  return axios.post(`/api/book?userId=${state.user.userId}&gameId=${bookInfo.gameId}`, { bookInfo })
  .then((result) => {
    console.log('/api/book result:', result.data)
    throw 'test err'
    commit('bookSlot', result.data.rsvId)
    return result.data
  }).catch(err => {
    console.log('woho err:', err.message)
  })
}

// надо запрашивать отдельно список игр, отдельно что входит в игру
// для этого переделать формат ответа сервера

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
      commit('setUpdatedFlag', true)
    });
};

const getUserInfo = ({ commit, state }) => {
  console.log('actions::getUserInfo')
  return axios
    .get(`/api/user`)
    .then(response => {
      console.log('/api/user response:', response.data);
      commit('user', response.data);
    })
    .catch(error => {
      console.log('/api/user error:', error);
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
  getUserInfo,
  init,
}
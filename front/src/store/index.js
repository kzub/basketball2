import mutations from './mutations'
import actions from './actions'

const Store = (Vuex) => {
  return new Vuex.Store({
    state: {
      user: undefined,
      games: [],
      gameDetails: undefined,
      newGameOptions: undefined,
      viewDataUpdated: true,
      reservationExpire: undefined,
      reservationDetails: undefined,
      place: undefined,
    },
    mutations,
    actions,
  })
}

export default Store
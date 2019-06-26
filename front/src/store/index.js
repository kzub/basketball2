import mutations from './mutations'
import actions from './actions'

const Store = (Vuex) => {
  return new Vuex.Store({
    state: {
      user: undefined,
      games: [],
      gameDetails: undefined,
      viewDataUpdated: false,
    },
    mutations,
    actions,
  })
}

export default Store
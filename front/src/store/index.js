import mutations from './mutations'
import actions from './actions'

const Store = (Vuex) => {
  return new Vuex.Store({
    state: {
      freePayment: undefined,
      freePaymentList: undefined,
      gameDetails: undefined,
      games: [],
      newGameOptions: undefined,
      place: undefined,
      reservationDetails: undefined,
      reservationExpire: undefined,
      user: undefined,
      viewDataUpdated: true,
    },
    mutations,
    actions,
  })
}

export default Store
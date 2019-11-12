import mutations from './mutations'
import actions from './actions'

const Store = (Vuex) => {
  return new Vuex.Store({
    state: {
      apiError: undefined,
      creditors: undefined,
      freePayment: undefined,
      freePaymentList: undefined,
      gameDetails: undefined,
      games: [],
      myGamesOnly: false,
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
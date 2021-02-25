import mutations from './mutations'
import actions from './actions'
import localstorage from './localstorage'

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
      reservationExpire: undefined,
      rsvTransferCode: undefined,
      user: undefined,
      viewDataUpdated: true,
      authCode: localstorage.getAuthCode(),
    },
    mutations: {
      ...mutations,
      createAuthCode: localstorage.createAuthCode,
      resetAuthCode: localstorage.resetAuthCode,
      setAuthCode: localstorage.setAuthCode,
    },
    actions,
  })
}

export default Store
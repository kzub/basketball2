import mutations from './mutations'
import actions from './actions'
import localstorage from './localstorage'

const Store = (Vuex) => {
  return new Vuex.Store({
    state: {
      apiError: undefined,
      authCode: localstorage.getAuthCode(),
      creditors: undefined,
      freePayment: undefined,
      freePaymentList: undefined,
      gameDetails: undefined,
      games: [],
      gamesStats: undefined,
      myGamesOnly: false,
      newGameOptions: undefined,
      place: undefined,
      reservationExpire: undefined,
      rsvTransferCode: undefined,
      user: undefined,
      viewDataUpdated: true,
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
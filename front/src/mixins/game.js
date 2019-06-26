
const mxLocationInfo = function () {
  const gameId = this.$router.currentRoute.query.gameId && Number(this.$router.currentRoute.query.gameId)
  const rsvId = this.$router.currentRoute.query.rsvId && Number(this.$router.currentRoute.query.rsvId)
  const retUrl = this.$router.currentRoute.query.retUrl
  const slotType = this.$router.currentRoute.query.slotType

  return { gameId, retUrl, slotType, rsvId }
}

const mxGameInfo = function (gameId) {
  const game = this.$store.state.games.filter(g => g.gameId === gameId)[0]

  if (!game) {
    if (this.$store.state.games.length) {
      console.log('no game found', gameId)
      this.$router.push('/')
    }
    return 
  }

  return game
}

const mxReservationInfo = function (gameId, rsvId) {
  const game = this.$store.state.games.filter(g => g.gameId === gameId)[0]

  if (!game) {
    if (this.$store.state.games.length) {
      console.log('no game found', gameId)
      this.$router.push('/')
    }
    return 
  }

  const reservation = game.slots.filter(s => s.rsvId === rsvId)[0]
  if (!reservation) {
    if (game.slots.length) {
      console.log('no reservation found', rsvId)
      this.$router.push('/')
    }
    return 
  }

  return reservation
}

export default {
	computed: {
    mxLocationInfo,
  },
  methods: {
    mxGameInfo,
    mxReservationInfo,
  }
}

const mxLocationInfo = function () {
  const gameId = this.$router.currentRoute.query.gameId && Number(this.$router.currentRoute.query.gameId)
  const bookId = this.$router.currentRoute.query.bookId && Number(this.$router.currentRoute.query.bookId)
  const retUrl = this.$router.currentRoute.query.retUrl
  const slotType = this.$router.currentRoute.query.slotType

  return { gameId, retUrl, slotType, bookId }
}

// get current game from store or load data if store is empty
const mxGameDetails = function () {
  const locationInfo = mxLocationInfo.call(this)
  if (!this.$store.state.gameDetails ||
        locationInfo.gameId !== this.$store.state.gameDetails.game.gameId) {
          this.$store.dispatch('updateGameData', locationInfo.gameId);
        return
      }
  return this.$store.state.gameDetails
}

const mxBookInfo = function () {
  const locationInfo = mxLocationInfo.call(this)
  const gameDetails = mxGameDetails.call(this)
  const bookId = locationInfo.bookId
  const players = gameDetails.players.filter(s => s.bookId === bookId)[0]
  const waiters = gameDetails.waiters.filter(s => s.bookId === bookId)[0]
  const book = players || waiters
  if (!book) {
    console.log('no book found by id:', bookId)
    this.$router.push('/')
    return
  }

  return book
}

export default {
	computed: {
    mxLocationInfo,
    mxGameDetails,
    mxBookInfo,
  },
  methods: {
  }
}
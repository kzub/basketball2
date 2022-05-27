<template>
  <div>
    <b-btn @click="back" class="btn-lg mb-3 rounded-0" block variant="warning">
      <div class="arrow-left"><i class="left"></i></div>
      <span>Назад</span>
    </b-btn>

    <b-card-body class="p-2 m-2">
      <h3>Статитсика</h3>
    </b-card-body>


    <div v-for="gstat in gameStats" :key="gstat.month+gstat.place">
      <b-btn class="btn-lg mt-2 mb-3 rounded-0 text-left" block variant="secondary">
        {{gstat.place}}, {{mxMonth(gstat.month)}} - {{gstat.monthTotal}} руб.
      </b-btn>
      <b-table small borderless striped
        :fields="gameFields"
        :items="gstat.data">
      </b-table>
      <hr class="mb-5">
    </div>

  </div>
</template>

<script>
import DateTime from '../mixins/datetime.js'
export default {
  name: 'MyStats',
  components: {
  },
  mixins: [DateTime],
  mounted () {
    this.$store.dispatch('getGamesStatistics')
  },
  computed: {
    gameStats () {
      return (this.$store.state.gamesStats && this.$store.state.gamesStats.stats) || []
    },
    gameFields: function () {
      return [
        { key: 'datetime', label: 'Игра' },
        { key: 'players', label: 'Игроков' },
        { key: 'totalSum', label: 'Взносы, руб.' },
      ]
    },
  },
  methods: {
    back: function() {
      this.$router.push({
        path: '/',
      })
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

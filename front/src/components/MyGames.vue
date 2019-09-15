<template>
  <div>
    <b-btn @click="back" class="btn-lg mb-3 rounded-0" block variant="warning">
      <div class="arrow-left"><i class="left"></i></div>
      <span>Назад</span>
    </b-btn>

    <b-card-body class="p-2 m-2">
      <h3>Мои последние игры</h3>
    </b-card-body>

    <Games :games="games" myGamesOnly="true"/>

  </div>
</template>

<script>

import Games from './Games.vue'

export default {
  name: 'MyGames',
  components: {
    Games,
  },
  computed: {
    games () {
      return this.$store.state.games
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

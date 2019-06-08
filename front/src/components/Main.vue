<template>
  <div>
    <Auth/>

    <Games :games="games"/>

    <b-btn class="btn-lg mt-4 rounded-0" block 
    href="tg://resolve?domain=playbasket" variant="outline-secondary">
      Наш чат в телеграм
    </b-btn>
  </div>
</template>

<script>

// import Playground from './Playground.vue'
import Games from './Games.vue'
import Auth from './Auth.vue'
// import GameUtils from '../mixins/game.js'
  
export default {
  name: 'Main',
  // mixins: [GameUtils],
  components: {
    Games,
    Auth,
  },
  computed: {
    games () {
      return this.$store.state.games
    },
  },
  methods: {
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

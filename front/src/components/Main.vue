<template>
  <div>
    <Auth/>

    <Games :games="games"/>

    <hr/>
    <b-btn class="btn-lg mt-2 mb-3 rounded-0" block
    :href="link" variant="warning">
      Наш чат в телеграм
    </b-btn>

  </div>
</template>

<script>

import Games from './Games.vue'
import Auth from './Auth.vue'

export default {
  name: 'Main',
  components: {
    Games,
    Auth,
  },
  computed: {
    games () {
      return this.$store.state.games
    },
    link () {
      return 'tg://resolve?domain=playbasket'
    }
  },
  methods: {
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

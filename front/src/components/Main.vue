<template>
  <div>
    <Auth/>

    <Games :games="games"/>

    <hr/>
    <router-link v-if="user && user.isOrganizer" to="/admin" tag="div">
      <b-btn class="btn-lg mt-2 mb-3 rounded-0" block variant="danger">
        Добавить игру<div class="arrow"><i class="right"></i></div>
      </b-btn>
    </router-link>

    <b-btn class="btn-lg mt-2 mb-3 rounded-0" block
    :href="link" variant="warning">
      Наш чат в телеграм
      <div class="arrow"><i class="right"></i></div>
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
    user () {
      return this.$store.state.user
    },
    games () {
      return this.$store.state.games
    },
    link () {
      return 'tg://resolve' + '?domain=playbasket'
    }
  },
  methods: {
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

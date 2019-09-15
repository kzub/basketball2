<template>
  <div>
    <Auth/>

    <Games :games="games"/>

    <div v-if="user && user.isOrganizer">
      <hr/>
      <router-link to="/game/new" tag="div">
        <b-btn class="btn-lg mt-2 mb-3 rounded-0" block variant="danger">
          Добавить игру <div class="arrow"><i class="right"></i></div>
        </b-btn>
      </router-link>

      <router-link v-if="user.hasYM" to="/fpList" tag="div">
        <b-btn class="btn-lg mt-2 mb-3 rounded-0" block variant="secondary">
          Ссылка на оплату <div class="arrow"><i class="right"></i></div>
        </b-btn>
      </router-link>

      <router-link to="/myGames" tag="div">
        <b-btn class="btn-lg mt-2 mb-3 rounded-0" block variant="secondary">
          Мои последние игры <div class="arrow"><i class="right"></i></div>
        </b-btn>
      </router-link>
    </div>

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
    myGamesOnly () {
      return this.$store.state.myGamesOnly
    },
  },
  methods: {
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

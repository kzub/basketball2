<template>
  <div>
    <Auth/>

    <Games :games="games"/>

    <hr/>
    <router-link v-if="user && user.isOrganizer" to="/game/new" tag="div">
      <b-btn class="btn-lg mt-2 mb-3 rounded-0" block variant="danger">
        Добавить игру<div class="arrow"><i class="right"></i></div>
      </b-btn>
    </router-link>

    <router-link v-if="user && user.hasYM" to="/fpList" tag="div">
      <b-btn class="btn-lg mt-2 mb-3 rounded-0" block variant="secondary">
        Ссылка на оплату<div class="arrow"><i class="right"></i></div>
      </b-btn>
    </router-link>

    <b-btn v-if="user && user.isOrganizer" @click="showPastGames" class="btn-lg mt-2 mb-3 rounded-0" block variant="secondary">
      <span v-if="myGamesOnly">Все текущие игры</span>
      <span v-else>Мои последние игры</span>
    </b-btn>

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
    },
    myGamesOnly () {
      return this.$store.state.myGamesOnly
    },
  },
  methods: {
    showPastGames: function() {
      this.$store.dispatch('updateGamesData', {
        showMyGames: !this.myGamesOnly,
      })
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

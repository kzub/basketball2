<template>
  <div>
    <Auth/>
    
    <b-card-body class="p-2 m-2">
      <h3>Текущие игры</h3>
    </b-card-body>
    <Games :games="games"/>

    <router-link v-if="user && user.credits.length" to="/myCredits" tag="div">
      <b-btn class="btn-lg mt-4 mb-4 rounded-0" block variant="warning">
        Счета предоплаты: {{credits}} ₽<div class="arrow"><i class="right"></i></div>
      </b-btn>
    </router-link>

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

      <router-link v-if="user.hasYM" to="/credits" tag="div">
        <b-btn class="btn-lg mt-2 mb-3 rounded-0" block variant="secondary">
          Список предоплат <div class="arrow"><i class="right"></i></div>
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
    credits () {
      return this.user && this.user.credits.reduce((acc, elm) => acc + elm.total, 0)
    },
  },
  methods: {
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

<template>
  <div>
    <Auth/>

    <b-card-body class="p-2 m-2">
      <h3>Текущие игры</h3>
    </b-card-body>
    <Games :games="games"/>

    <router-link v-if="user && user.credits && user.credits.length" to="/myCredits" tag="div">
      <b-btn class="btn-lg mt-4 mb-4 rounded-0" block variant="warning">
        Мои предоплаты: {{credits}} р.<div class="arrow"><i class="right"></i></div>
      </b-btn>
    </router-link>

    <div v-if="user && user.isOrganizer">
      <hr/>
      <router-link to="/game/new" tag="div">
        <b-btn class="btn-lg mt-2 mb-3 rounded-0" block variant="danger">
          Добавить игру <div class="arrow"><i class="right"></i></div>
        </b-btn>
      </router-link>

      <router-link to="/game/new/copy" tag="div">
        <b-btn class="btn-lg mt-2 mb-3 rounded-0" block variant="danger">
          Скопировать игру <div class="arrow"><i class="right"></i></div>
        </b-btn>
      </router-link>

      <router-link v-if="user.hasYM" to="/fpList" tag="div">
        <b-btn class="btn-lg mt-2 mb-3 rounded-0" block variant="secondary">
          Ссылка на оплату <div class="arrow"><i class="right"></i></div>
        </b-btn>
      </router-link>

      <router-link v-if="user.hasYM" to="/credits" tag="div">
        <b-btn class="btn-lg mt-2 mb-3 rounded-0" block variant="secondary">
          Счета предоплат <div class="arrow"><i class="right"></i></div>
        </b-btn>
      </router-link>

      <router-link to="/myGames" tag="div">
        <b-btn class="btn-lg mt-2 mb-3 rounded-0" block variant="secondary">
          Мои последние игры <div class="arrow"><i class="right"></i></div>
        </b-btn>
      </router-link>

      <router-link to="/myStats" tag="div">
        <b-btn class="btn-lg mt-2 mb-3 rounded-0" block variant="secondary">
          Статистика <div class="arrow"><i class="right"></i></div>
        </b-btn>
      </router-link>
    </div>

    <div v-if="user && user.isSystemOwner">
      <hr/>
      <router-link to="/loginLink" tag="div">
        <b-btn class="btn-lg mt-2 mb-3 rounded-0" block variant="danger">
            Ссылка на вход<div class="arrow"><i class="right"></i></div>
        </b-btn>
      </router-link>
    </div>

    <div v-if="user && user.auth"  class="mt-5">
      <b-btn class="btn-lg mt-2 mb-3 rounded-0" block variant="secondary">
        <b-link target="_blank" class="text-white" href="https://t.me/playbasket">Связаться с нами</b-link >
      </b-btn>
      <b-btn class="btn-lg mt-2 mb-3 rounded-0" block variant="secondary">
        <b-link target="_blank" class="text-white" href="https://github.com/kzub/basketball2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </b-link>
      </b-btn>
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

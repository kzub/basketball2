<template>
    <div id="app">
      <transition name="slide">
        <div v-if="apiError">
          <b-btn @click="reload" class="btn-lg mb-3 rounded-0" block variant="warning">
            <div class="arrow-left"><i class="left"></i></div>
            <span>Обновить</span>
            <div class="arrow"><i class="right"></i></div>
          </b-btn>
          <h4 class="mt-4">
            Сайт временно недоступен
          </h4>
          <h6 class="mt-4">
            Попробуйте обновить страницу позже
          </h6>
        </div>

        <router-view v-else>
        </router-view>
      </transition>
    </div>
</template>

<script>

import VueRouter from 'vue-router'

import Book from './components/Book.vue'
import BookTransfer from './components/BookTransfer.vue'
import Credits from './components/Credits.vue'
import FreePayment from './components/FreePayment.vue'
import FreePaymentLinks from './components/FreePaymentLinks.vue'
import Game from './components/Game.vue'
import GameNew from './components/GameNew.vue'
import GamePayments from './components/GamePayments.vue'
import LoginLink from './components/LoginLink.vue'
import Main from './components/Main.vue'
import MapView from './components/MapView.vue'
import MyCredits from './components/MyCredits.vue'
import MyGames from './components/MyGames.vue'
import Profile from './components/Profile.vue'
import Reservation from './components/Reservation.vue'
import Success from './components/Success.vue'

const router = new VueRouter({
  routes :[
    { path: '/', component: Main },
    { path: '/book', component: Book },
    { path: '/bookTransfer', component: BookTransfer },
    { path: '/credits', component: Credits },
    { path: '/fp', component: FreePayment},
    { path: '/fpList', component: FreePaymentLinks},
    { path: '/game', component: Game },
    { path: '/game/new', component: GameNew },
    { path: '/loginLink', component: LoginLink },
    { path: '/map', component: MapView},
    { path: '/myCredits', component: MyCredits },
    { path: '/myGames', component: MyGames },
    { path: '/payments', component: GamePayments },
    { path: '/profile', component: Profile },
    { path: '/profile/login', component: Profile },
    { path: '/reservation', component: Reservation },
    { path: '/success', component: Success},
  ],
})

export default {
  name: 'app',
  router,
  mounted () {
    this.$store.dispatch('getUserInfo', {}).then(user => {
      // force to enter username for new users
      if (user && user.auth && !user.name) {
        this.$router.push({
          path: '/profile',
        })
      }
    })
  },
  computed: {
    apiError: function () {
      return this.$store.state.apiError;
    },
  },
  methods: {
    reload: function () {
      this.$store.dispatch('getUserInfo', {}).then(() => {
        this.$router.push({
          path: '/',
        })
      })
    },
  },
}

</script>

<style>

#app {
  font-family: Roboto, Avenir, Arial, Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.slide-enter {
  /*left: 100%;*/
  margin-left: 100%;
}
.slide-enter-to {
  /*left: 0%;*/
  margin-left: 0%;
}

.slide-enter-active {
  position: absolute;
  width: 100%;
  max-width: 500px;
  transition: margin-left 0.3s;
}

.slide-leave {
  margin-left: 0%;
  opacity: 1.0;
}
.slide-leave-to {
  margin-left: 100%;
  opacity: 0.0;
}

.slide-leave-active {
  position: fixed;
  width: 100%;
  max-width: 500px;

  transition: margin-left 0.3s, opacity 0.3s;
}

</style>

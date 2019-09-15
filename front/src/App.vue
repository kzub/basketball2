<template>
    <div id="app">
      <transition name="slide">
        <router-view/>
      </transition>
    </div>
</template>

<script>

import VueRouter from 'vue-router'

import Book from './components/Book.vue'
import Credits from './components/Credits.vue'
import FreePayment from './components/FreePayment.vue'
import FreePaymentLinks from './components/FreePaymentLinks.vue'
import Game from './components/Game.vue'
import GameNew from './components/GameNew.vue'
import Main from './components/Main.vue'
import MapView from './components/MapView.vue'
import MyGames from './components/MyGames.vue'
import Profile from './components/Profile.vue'
import Reservation from './components/Reservation.vue'
import Success from './components/Success.vue'

const router = new VueRouter({
  routes :[
    { path: '/', component: Main },
    { path: '/book', component: Book },
    { path: '/credits', component: Credits },
    { path: '/fp', component: FreePayment},
    { path: '/fpList', component: FreePaymentLinks},
    { path: '/game', component: Game },
    { path: '/game/new', component: GameNew },
    { path: '/map', component: MapView},
    { path: '/myGames', component: MyGames },
    { path: '/profile', component: Profile },
    { path: '/reservation', component: Reservation },
    { path: '/success', component: Success},
  ],
})

export default {
  name: 'app',
  components: {
  },
  router,
}

</script>

<style>

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
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

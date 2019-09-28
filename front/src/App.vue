<template>
    <div id="app">
      <transition name="slide">
        <router-view/>
      </transition>
    </div>
</template>

<script>

import VueRouter from 'vue-router'

const Book = () => import(/* webpackChunkName: "book" */ './components/Book.vue')
const Credits = () => import(/* webpackChunkName: "payments" */ './components/Credits.vue')
const FreePayment = () => import(/* webpackChunkName: "payments" */ './components/FreePayment.vue')
const FreePaymentLinks = () => import(/* webpackChunkName: "admin" */ './components/FreePaymentLinks.vue')
const Game = () => import(/* webpackChunkName: "game" */ './components/Game.vue')
const GameNew = () => import(/* webpackChunkName: "admin" */ './components/GameNew.vue')
const GamePayments = () => import(/* webpackChunkName: "payments" */ './components/GamePayments.vue')
const Main = () => import(/* webpackChunkName: "game" */ './components/Main.vue')
const MapView = () => import(/* webpackChunkName: "details" */ './components/MapView.vue')
const MyCredits = () => import(/* webpackChunkName: "payments" */ './components/MyCredits.vue')
const MyGames = () => import(/* webpackChunkName: "admin" */ './components/MyGames.vue')
const Profile = () => import(/* webpackChunkName: "profile" */ './components/Profile.vue')
const Reservation = () => import(/* webpackChunkName: "rsv" */ './components/Reservation.vue')
const Success = () => import(/* webpackChunkName: "payments" */ './components/Success.vue')

const router = new VueRouter({
  routes :[
    { path: '/', component: Main },
    { path: '/book', component: Book },
    { path: '/credits', component: Credits },
    { path: '/fp', component: FreePayment},
    { path: '/fpList', component: FreePaymentLinks},
    { path: '/game', component: Game },
    { path: '/game/new', component: GameNew },
    { path: '/payments', component: GamePayments },
    { path: '/map', component: MapView},
    { path: '/myCredits', component: MyCredits },
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

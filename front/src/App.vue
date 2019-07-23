<template>
  <div id="app">
    <transition name="slide">
      <router-view/>
    </transition>
  </div>

</template>

<script>

import VueRouter from 'vue-router'

import Main from './components/Main.vue'
import Admin from './components/Admin.vue'
import Profile from './components/Profile.vue'
import Book from './components/Book.vue'
import Reservation from './components/Reservation.vue'
import Game from './components/Game.vue'
import Success from './components/Success.vue'
import MapView from './components/MapView.vue'

const router = new VueRouter({
  routes :[
    { path: '/', component: Main },
    { path: '/admin', component: Admin },
    { path: '/profile', component: Profile },
    { path: '/game', component: Game },
    { path: '/book', component: Book },
    { path: '/reservation', component: Reservation },
    { path: '/success', component: Success},
    { path: '/map', component: MapView}
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
  max-width: 380px;
}

.slide-enter {
  left: 100%;
}
.slide-enter-to {
  left: 0%;
}

.slide-enter-active {
  position: absolute;
  width: 100%;
  transition: left 0.3s;
}

.slide-leave {
  left: 0%;
  opacity: 1.0;
}
.slide-leave-to {
  left: 100%;
  opacity: 0.0;
}

.slide-leave-active {
  position: fixed;
  width: 100%;

  transition: left 0.3s, opacity 0.3s;
}

</style>

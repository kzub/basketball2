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

const router = new VueRouter({
  routes :[
    { path: '/', component: Main },
    { path: '/admin', component: Admin },
    { path: '/profile', component: Profile },
    { path: '/game', name:'game', component: Game },
    { path: '/book', name:'book', component: Book },
    { path: '/reservation', name:'reservation', component: Reservation },
  ],
})

export default {
  name: 'app',
  components: {
    Main,
    Admin,
    Profile,
    Book,
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
  /*margin-top: 60px;*/
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

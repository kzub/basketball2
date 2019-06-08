<template>
  <div class="mb-4">
    <!-- <h3>Loading...</h3>
    Тут надо сверстать 
    войти
    номер телефона, кнопка отправить (защита массовой отправки)
    введите пин код
    номер телефона (только чтение), имя фамилия, выйти
    <br>
    <router-link to="/foo">Go to Foo</router-link>
    <br>
    <router-link to="/bar">Go to Bar</router-link>
    <br> -->
    <transition>
      <router-view></router-view>
    </transition>
  </div>
</template>


<script>

import VueRouter from 'vue-router'
import UserName from './Auth/UserName.vue'
import Profile from './Auth/Profile.vue'
import Register from './Auth/Register.vue'


const routes = [
  { path: '/', component: UserName },
  { path: '/profile', component: Profile },
  { path: '/login', component: Register },
]

const router = new VueRouter({
  routes // short for `routes: routes`
})

export default {
  name: 'Login',
  router,
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>

import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import BootstrapVue from 'bootstrap-vue'

Vue.use(BootstrapVue)
Vue.use(VueRouter)
Vue.use(Vuex)

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import Store from './store'
import App from './App.vue'

Vue.config.productionTip = false

const store = Store(Vuex)
new Vue({
  store,
  render: h => h(App),
}).$mount('#app')

store.dispatch('init')
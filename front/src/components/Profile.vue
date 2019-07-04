<template>
  <div>
    <b-btn class="btn-lg mb-4 rounded-0" @click="back" block variant="warning">
      Назад
    </b-btn>
    <div v-if="!user || !user.auth" class="my-2">
      <Register/>
    </div>
    <div v-else-if="wantChange" class="my-2">
      <Register :name="user.name" :phone="user.phone"/>
    </div>
    <div v-else>
      <b-card no-body class="mb-1">
        <b-btn class="p-2 rounded-0" block href="#" v-b-toggle.regStep2 variant="secondary">
          Личные данные
        </b-btn>
        <b-card-body>
          <h5>{{ user.name }}</h5>
          <h5>{{ user.phone }}</h5>
        </b-card-body>
      </b-card>

      <b-btn class="mt-3" @click="changeProfile" variant="primary">Изменить</b-btn>
    </div>
  </div>
</template>

<script>

import Register from './Register.vue'

export default {
  name: 'Profile',
  components: {
    Register,
  },
  data: function() {
    return  {
      wantChange: false,
    }
  },
  computed: {
    user () {
      return this.$store.state.user
    },
  },
  methods: {
    changeProfile: function () {
      this.wantChange = true
    },
    back: function() {
      if (this.wantChange) {
        this.wantChange = false;
        return;
      }
      this.$router.back()
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}

</style>

<template>
  <div class="mb-4">
    <div v-if="!user" class="my-2">
      <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Loading...</span>
        </div>
      </div>
    </div>
    <div v-else>
      <router-link to="/profile" tag="div">
        <b-btn v-if="user.auth" class="btn-lg rounded-0" block variant="warning">
          {{ user.name }}
        <div class="arrow"><i class="right"></i></div>
        </b-btn>
        <b-btn v-else class="btn-lg rounded-0" block variant="warning">
          Зарегистрироваться
          <div class="arrow"><i class="right"></i></div>
        </b-btn>
      </router-link>
    </div>
  </div>
</template>

<script>


export default {
  name: 'Auth',
  computed: {
    user () {
      return this.$store.state.user
    },
  },
  methods: {
  },
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.user {
  line-height: 32px;
}
</style>

<style>
@import '../assets/backarrow.css';
</style>

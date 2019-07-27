<template>
  <div class="hello">
    <div v-if="!viewDataUpdated" class="my-2">
      <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Загружается...</span>
        </div>
      </div>
    </div>

    <div v-else>
      <b-btn @click="back" class="btn-lg mb-3 rounded-0" block variant="warning">
        <div class="arrow-left"><i class="left"></i></div>
        <span>Назад</span>
      </b-btn>
    </div>

    LALALA
  </div>
</template>

<script>
export default {
  name: 'Admin',
  props: {
  },
  mounted: function(){
    this.$store.dispatch('updateGamesData')
  },
  computed: {
    isAdmin () {
      return this.$store.state.user &&
        this.$store.state.user.userId === this.mxGameDetails.game.organizer.userId
    },
    user () {
      return this.$store.state.user
    },
    viewDataUpdated () {
      return this.$store.state.viewDataUpdated
    },
  },
  methods: {
    back: function() {
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

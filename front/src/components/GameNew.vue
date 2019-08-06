<template>
  <div>
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

    <div class="btn-danger p-2">Разел в разработке...</div><br><br>
    <form>
      <b-container class="px-1">
        <GameOptions v-for="option in newGameOptions" :option="option" :storage="choosedOptions"/>
      </b-container>
    </form>

    <b-btn class="w-75 mt-4 mb-5" variant="primary" @click="click">Создать</b-btn>
  </div>
</template>

<script>
import GameOptions from './GameOptions.vue'

export default {
  name: 'GameNew',
  props: [],
  components: {
    GameOptions,
  },
  mounted: function(){
    this.$store.dispatch('getNewGameOptions')
  },
  data: function () {
    return {
      choosedOptions: {},
    }
  },
  computed: {
    user () {
      return this.$store.state.user
    },
    viewDataUpdated () {
      return this.$store.state.viewDataUpdated
    },
    newGameOptions () {
      return this.$store.state.newGameOptions
    },
  },
  methods: {
    back: function () {
      this.$router.back()
    },
    click: function () {

      console.log('HAHA', this.choosedOptions);
    }
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

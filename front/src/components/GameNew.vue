<template>
  <div>
    <b-btn @click="back" class="btn-lg mb-3 rounded-0" block variant="warning">
      <div class="arrow-left"><i class="left"></i></div>
      <span>Назад</span>
    </b-btn>

    <div v-if="!viewDataUpdated" class="my-4 p-4">
      <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Загружается...</span>
        </div>
      </div>
    </div>
    <div v-else-if="!hideInputs">
      <h3 class="my-4">
        Новая игра
      </h3>
      <form @submit="onCreate">
        <b-container class="px-1">
          <GameOptions v-for="option in newGameOptions" :option="option" :storage="choosedOptions" v-bind:key="option.label"/>
        </b-container>
        
        <b-btn class="w-75 mt-4 mb-5" variant="primary" type="submit">Создать</b-btn>
      </form>
    </div>

    <!-- error window -->
    <div>
      <b-modal id="errNewGame" title="Ошибка" ok-variant="danger" ok-title="ОК" cancel-variant="hidden">
        <p class="my-4">Возникла ошибка в процессе создания игры</p>
      </b-modal>
    </div>
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
      hideInputs: false,
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
    onCreate: function (evt) {
      evt.preventDefault()
      const self = this;

      const choosedOptions = Object.entries(this.choosedOptions)
      const options = {}

      for (const [key, value] of choosedOptions) {
        if (value.inputResults) {
          options[key] = value.selected
          for (const [inpKey, inpVal] of Object.entries(value.inputResults)) {
            options[inpKey] = inpVal
          }
        } else {
          options[key] = value
        }
      }

      self.hideInputs = true // after game being created inputs are shown, but transition to new game screen is not started yet
      self.$store.dispatch('addGame', options)
      .then(function(result){
        if (result && result.ok) {
          self.$router.push({
            path: '/game',
            query: {
              gameId: result.gameId,
            },
          })
        } else {
          self.hideInputs = false
          self.$bvModal.show('errNewGame')
        }
      })
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

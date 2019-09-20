<template>
  <div>
    <b-btn class="w-100 btn-lg mb-3 rounded-0" variant="primary">
      Информация
    </b-btn>
    <div class="d-flex flex-column justify-content-center">
      <div class="mt-4"> Успешная оплата! </div>
      <div class="mt-4">
        <b-btn :href="retUrl" class="mt-1 w-25" variant="success">
          OK
        </b-btn>
      </div>
    </div>
  </div>
</template>

<script>
import GameUtils from '../mixins/game.js'

export default {
  name: 'Success',
  props: [],
  mixins: [GameUtils],
  components: {
  },
  computed: {
    retUrl: function () {
      if (this.mxLocationInfo.gameId) {
        return `/#/game?gameId=${this.mxLocationInfo.gameId}`
      }
      return '/#/'
    },
  },
  methods: {
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

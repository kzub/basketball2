<template>
  <div role="tablist">

    <div v-if="!viewDataUpdated" class="my-2">
      <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Загружается...</span>
        </div>
      </div>
    </div>

    <div v-else>
      <div v-for="game in games" :key="game.gameId">
        <b-card no-body class="my-2 w-100">
          <b-card-header header-tag="header" class="p-0" role="tab">
            <b-btn :class="gameBorderColor(game)" block variant="primary" @click="gameClick(game.gameId)">
              <div class="d-flex flex-row  justify-content-between">
                <div class="d-flex flex-column justify-content-start align-items-start">
                  <div>
                    {{mxDateWeekDay(game.date)}}, {{mxDateDayAndMonth(game.date)}}
                  </div>
                  <div>
                    {{game.timeStart}} - {{game.timeEnd}}
                  </div>
                  <div>
                    {{gameType(game)}}
                  </div>
                </div>
                <div class="d-flex flex-column align-items-end">
                  <div>
                    <div class="badge px-2 my-1" :class="game.freePlayerSlots == 0 ? 'badge-danger' : 'badge-light'">
                      {{game.freePlayerSlots}}
                    </div>
                  </div>
                  <div class="badge px-2 my-1 badge-light w-100">
                    {{ game.place.title }}
                  </div>
                </div>
              </div>
            </b-btn>
          </b-card-header>
        </b-card>
      </div>      
    </div>

  </div>
</template>

<script>

import DateTime from '../mixins/datetime.js'

export default {
  name: 'Games',
  props: ['games'],
  mixins: [DateTime],
  mounted () {
    this.$store.dispatch('updateGamesData')
  },
  computed: {
    viewDataUpdated () {
      return this.$store.state.viewDataUpdated
    }
  },
  methods: {
    gameType: function (game) {
      if (game.status === 'poll') {
        return 'Предварительная запись'
      }
      if (game.status === 'settled') {
        return 'Игра запланирована'
      }
      return 'Неизвестный тип';
    },
    gameBorderColor: function (game) {
      let mode = '';
      if (game.status === 'poll') {
        mode += ' pollMode'
      }
      if (this.$store.state.user && this.$store.state.user.userId === game.organizer.userId) {
        mode += ' userIsAdmin'
      }
      return mode
    },
    gameClick: function (gameId) {
      this.$router.push({ 
        path: '/game',
        query: { gameId: gameId } 
      })
    },
  },
  components: {
  },
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.userIsAdmin {
  /*border: 2px dotted #dc3545;*/
  border-left: 10px solid #dc3545 !important;
}
.pollMode {
  /*border-left: 5px solid #dc3545;*/
  background-color: #557aa2;
  border-color: #557aa2;
}

</style>

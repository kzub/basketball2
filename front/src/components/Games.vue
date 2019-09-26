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
        <b-card no-body class="my-2 mx-1">
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
                  <div class="badge px-2 mt-2" :class="game.freePlayerSlots == 0 ? 'badge-danger' : 'badge-light'">
                    <UserIcon/>
                    <span class="player-count">{{game.playerSlots - game.freePlayerSlots}} из {{game.playerSlots}}</span>
                  </div>
                </div>
                <div class="badge p-2 mt-2 mb-1 badge-light w-100 place-title">
                  {{ game.place.title }}
                </div>
              </div>
            </div>
          </b-btn>
        </b-card>
      </div>

      <div v-if="games.length === 0">
        <b-card no-body class="my-4 mx-4">
          <b-btn class="noGames" block variant="secondary">
            Игр пока нет
          </b-btn>
        </b-card>

        <b-btn class="btn-lg mt-2 mb-3 rounded-0" block :href="chatLink" variant="warning">
          Наш чат в телеграм <div class="arrow"><i class="right"></i></div>
        </b-btn>
      </div>      
    </div>

  </div>
</template>

<script>

import DateTime from '../mixins/datetime.js'
import UserIcon from './UserIcon.vue'

export default {
  name: 'Games',
  props: ['games', 'myGamesOnly'],
  mixins: [DateTime],
  mounted () {
    this.$store.dispatch('updateGamesData', {
      showMyGames: this.myGamesOnly,
    })
    this.UserIcon = UserIcon
  },
  computed: {
    viewDataUpdated () {
      return this.$store.state.viewDataUpdated
    },
    chatLink () {
      return ['tg', '://', 'resolve', '?domain', '=playbasket'].join('')
    },
  },
  methods: {
    gameType: function (game) {
      if (game.status === 'settled') {
        return '' //'Игра запланирована'
      }
      if (game.status === 'disabled') {
        return 'выключена'
      }
      return '(статус не определен)';
    },
    gameBorderColor: function (game) {
      let mode = '';
      if (game.status === 'disabled') {
        mode += ' btn-danger'
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
    UserIcon,
  },
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.noGames {
  height: 100px;
  font-size: 20px;
}
.userIsAdmin {
  border-left: 10px solid #dc3545 !important;
}

.player-count {
  font-size: 14px;
  line-height: 14px;
  vertical-align: sub;
}

.place-title {
  font-size: 14px;
}

</style>

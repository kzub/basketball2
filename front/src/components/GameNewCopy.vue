<template>
  <div>
    <b-btn @click="back" class="btn-lg mb-3 rounded-0" block variant="warning">
      <div class="arrow-left"><i class="left"></i></div>
      <span>Назад</span>
    </b-btn>

    <div v-if="!games" class="my-4 p-4">
      <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Загружается...</span>
        </div>
      </div>
    </div>
    <div v-else-if="!hideInputs">
      <b-card-body class="p-2 m-2">
        <h3>Скопировать игру</h3>
      </b-card-body>

      <Games :games="games" myGamesOnly="true" :clickHandler="copyGameData" />

      <div v-if="selectedGame">
        <h3 class="pt-4">Будет создано</h3>
        <b-btn class="btn-primary weekCtrl" variant="primary" @click="addWeek(-1)"> - </b-btn>
        неделя
        <b-btn class="btn-primary weekCtrl" variant="primary" @click="addWeek(+1)"> + </b-btn>

        <b-btn class="btn-primary weekCtrl" variant="primary" @click="setCopies(-1)"> - </b-btn>
        игры
        <b-btn class="btn-primary weekCtrl" variant="primary" @click="setCopies(+1)"> + </b-btn>

        <div v-for="newGame in newGames" :key="newGame.date">
          <b-card no-body class="my-2 mx-1">
            <b-btn class="btn-danger" block>
              <div class="d-flex flex-row  justify-content-between">
                <div class="d-flex flex-column justify-content-start align-items-start">
                  <div>
                    {{mxDateWeekDay(newGame.date)}}, {{mxDateDayAndMonth(newGame.date)}}
                  </div>
                  <div>
                    {{newGame.timeStart}} - {{newGame.timeEnd}}
                  </div>
                  <div class="statusLine mt-1">
                    {{gameType(newGame)}}
                  </div>
                </div>
                <div class="d-flex flex-column align-items-end">
                  <div>
                    <div class="badge px-2 mt-2 badge-light">
                      <UserIcon/>
                      <span class="player-count">0 из {{newGame.playerSlots}}</span>
                    </div>
                  </div>
                  <div class="badge p-2 mt-2 mb-1 badge-light w-100 place-title">
                    {{ newGame.place.title }}
                  </div>
                </div>
              </div>
            </b-btn>
          </b-card>
        </div>

        <form @submit="onCreate">
          <b-btn class="w-75 mt-4 mb-5" variant="primary" type="submit">Создать</b-btn>
        </form>
      </div>

    </div>

    <!-- error window -->
    <div>
      <b-modal id="errselectedGame" title="Ошибка" ok-variant="danger" ok-title="ОК" cancel-variant="hidden">
        <p class="my-4">Возникла ошибка в процессе создания игры:</p>
        <code>{{ errorMessage }}</code>
      </b-modal>
    </div>
  </div>
</template>

<script>

import Games from './Games.vue'
import DateTime from '../mixins/datetime.js'
import UserIcon from './UserIcon.vue'

export default {
  name: 'GameNew',
  props: [],
  components: {
    Games,
    UserIcon,
  },
  mixins: [DateTime],
  data: function () {
    return {
      choosedOptions: {},
      hideInputs: false,
      errorMessage: '',
      selectedGame: undefined,
      newGames: [],
      weekNum: 0,
      copies: 1,
      additionalDaysShift: 0,
    }
  },
  computed: {
    user () {
      return this.$store.state.user
    },
    viewDataUpdated () {
      return this.$store.state.viewDataUpdated
    },
    games () {
      return this.$store.state.games
    },
  },
  methods: {
    back: function () {
      this.$router.back()
    },
    setNewDates: function () {
      this.newGames = []
      for (let idx = 0; idx < this.copies; idx++) {
        this.newGames.push(JSON.parse(JSON.stringify(this.selectedGame)))
        const newGame = this.newGames[idx];

        let openDateRelativeDiff = 0; // на сколько день открытия ранее дня игры
        if(newGame.openingDate) {
          openDateRelativeDiff = this.mxDateDiff(newGame.openingDate, this.selectedGame.date)
        }

        let nearestDay = this.mxNearestDayFromNow(this.selectedGame.date)
        newGame.date = this.mxAddDaysToDate(nearestDay, 7 * (this.weekNum + idx) + this.additionalDaysShift)
        if (newGame.openingDate) {
          newGame.openingDate = this.mxAddDaysToDate(newGame.date, openDateRelativeDiff)
        }
      }
    },
    addWeek: function (amount) {
      if ((this.weekNum > 0 && amount < 0) || amount > 0) {
        this.weekNum = this.weekNum + amount
      }
      this.setNewDates()
    },
    setCopies: function (amount) {
      this.copies += amount
      if (this.copies > 8) {
        this.copies = 8
      }
      else if (this.copies < 1) {
        this.copies = 1
      }
      this.setNewDates()
    },
    gameType: function (game) {
      if (game.openingMode === 'auto') {
        return `откроется ${this.mxDateDayAndMonth(game.openingDate)} в ${game.openingTime}`
      }
      return 'выключена'
    },
    copyGameData: function (game) {
      this.selectedGame = JSON.parse(JSON.stringify(game))
      this.selectedGame.placeId = this.selectedGame.place.placeId
      this.selectedGame.status = 'disabled'
      if (this.selectedGame.openingMode == 'performed') {
        this.selectedGame.openingMode = 'auto'
      }
      this.weekNum = 0
      this.additionalDaysShift = 0
      let nearestDay = this.mxNearestDayFromNow(this.selectedGame.date)

      if (nearestDay === this.selectedGame.date || this.mxDateDiff(this.mxGetToday(), nearestDay) == 0) {
        this.additionalDaysShift = 7
      }

      this.setNewDates()

      setTimeout(() => {
        window.scrollBy(0, 1000)
      }, 150)
    },
    onCreate: function (evt) {
      evt.preventDefault()
      const self = this;

      self.hideInputs = true // after game being created inputs are shown, but transition to new game screen is not started yet

      Promise.all(this.newGames.map(newGame => self.$store.dispatch('addGame', newGame)))
      .then(function(result){
        if (result && result.every(r => r.ok)) {
          self.$router.push({
            path: '/',
            query: {
              gameId: result.gameId,
            },
          })
        } else {
          self.hideInputs = false
          self.errorMessage = result && result.data
          self.$bvModal.show('errselectedGame')
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
.weekCtrl {
  width: 50px;
  padding: 5px 5px;
  margin: 10px 10px;
}
</style>

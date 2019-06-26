<template>
  <div>
    <div v-if="!gameDetails" class="my-2">
      <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Загружается...</span>
        </div>
      </div>
    </div>

    <div v-else>
      <b-btn class="btn-lg mb-3 rounded-0" block @click="back" variant="warning">
        Назад
      </b-btn>

      <GameInfo :game="gameDetails.game" show="place,time"/>
      <GameInfo :game="gameDetails.game" show="organizer,payment"/>

      <div v-if="!booking" class="mx-2 mt-5">
        <b-btn class="w-100 btn-lg" @click="bookSlot" variant="success">
          Забронировать
        </b-btn>
      </div>
      <div v-else class="spinner-border mt-5" role="status">
        <span class="sr-only">Бронирую...</span>
      </div>
    </div>

    <div>
      <b-modal ref="errModal" title="Ошибка бронирования" ok-variant="danger" ok-title="ОК" cancel-variant="hidden"
        @ok="handleError">
        <h5 class="my-4 text">Не удалось забронировать место, проверьте связь с интернетом и наличие свободных мест</h5>
      </b-modal>
    </div>
  </div>
</template>

<script>

import DateTime from '../mixins/datetime.js'
import GameUtils from '../mixins/game.js'
import Organizer from './Organizer.vue'
import GameInfo from './GameInfo.vue'
import axios from 'axios'

export default {
  name: 'Book',
  mixins: [DateTime, GameUtils],
  components: {
    GameInfo,
  },
  data : function () {
    return {
      booking: false
    };
  },
  computed: {
    gameDetails () {
      if (!this.$store.state.gameDetails || 
        this.mxLocationInfo.gameId !== this.$store.state.gameDetails.game.gameId) {
          this.$store.dispatch('updateGameData', this.mxLocationInfo.gameId);
      }
      return this.$store.state.gameDetails
    },
    user () {
      return this.$store.state.user
    },
  },
  methods: {
    back: function() {
      this.$router.push({
        path: '/game',
        query: {
          gameId: this.mxLocationInfo.gameId,
        }
      })
    },
    bookSlot: function() {
      this.booking = true
      const { gameDetails, user } = this

      this.$store.dispatch('bookSlot', {
        gameId: gameDetails.game.gameId,
        userId: user.userId,
      })
      .then((data) => {
        this.$router.push({
          path: '/reservation',
          query: {
            gameId: gameDetails.game.gameId,
            rsvId: data.rsvId,
          }
        });
      })
      .catch(error => {
        // console.log('/api/v2/book error:', error)
        this.$refs.errModal.show()
      })
      .finally(() => this.booking = false)
    },
    handleError: function () {
      this.$router.push({
          path: '/game',
          query: {
            gameId: this.gameDetails.game.gameId,
          }
        });
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}

</style>
<style>
.btn-hidden {
  display: none;
}  
</style>

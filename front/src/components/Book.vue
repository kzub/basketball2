<template>
  <div>
    <div v-if="!mxGameDetails" class="my-2">
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

      <GameInfo :game="mxGameDetails.game" show="place,time"/>
      <hr/>
      <GameInfo :game="mxGameDetails.game" show="organizer,payment"/>
      <hr/>

      <div v-if="!booking" class="mb-4 px-3 mt-4 d-flex flex-column">
        <b-btn v-if="isWaiter" class="my-1" @click="bookSlot" variant="secondary">
          Занять очередь
        </b-btn>
        <b-btn v-else class="my-1" @click="bookSlot" variant="primary">
          Забронировать
        </b-btn>
          <span v-else="isWaiter">Забронировать</span>
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
    user: function () {
      return this.$store.state.user
    },
    isWaiter: function () {
      return this.mxLocationInfo.slotType == 'waiter'
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
      const { mxLocationInfo } = this

      this.$store.dispatch('bookSlot', { ...mxLocationInfo })
      .then((data) => {
        if (data.result == 'booked') {
          this.$store.dispatch('updateGameData', mxLocationInfo.gameId);
          this.$router.push({
            path: '/reservation',
            query: {
              gameId: data.gameId,
              bookId: data.bookId,
            }
          });
          return;
        }
        throw new Error('Cannot book')
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
            gameId: this.mxGameDetails.game.gameId,
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

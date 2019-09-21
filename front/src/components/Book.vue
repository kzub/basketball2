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
        <div class="arrow-left"><i class="left"></i></div>
        <span>Назад</span>
      </b-btn>

      <GameInfo :game="mxGameDetails.game" show="place,time"/>
      <div class="d-flex flex-column">
        <div class="px-3">
          <hr/>
          <h5 class="mt-2">
            <GameInfo class="pl-3 text-left" :game="mxGameDetails.game" show="organizer"/>
          </h5>
          <h5 class="mt-2">
            <GameInfo class="pl-3 text-left font-weight-bold" :game="mxGameDetails.game" show="payment"/>
          </h5>
          <hr/>
        </div>

        <div v-if="!booking" class="mb-4 px-3 mt-2">
          <div v-if="creditsTotal" class="text-left">
            <h5 class="p-2">Ваш счет предоплаты: {{creditsTotal}} ₽</h5>
          </div>

          <b-btn v-if="isWaiter" class="w-100 py-2" @click="bookSlot" variant="secondary">
            Занять очередь <div class="arrow"><i class="right"></i></div>
          </b-btn>
          <b-btn v-else class="w-100  py-2" @click="bookSlot" variant="primary">
            Забронировать <div class="arrow"><i class="right"></i></div>
          </b-btn>
        </div>
        <div v-else class="spinner-border mx-auto mt-5" role="status">
          <span class="sr-only">Бронирую...</span>
        </div>
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
import GameInfo from './GameInfo.vue'

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
    creditsTotal: function () {
      return this.mxGameDetails.creditsTotal || 0
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
      const newBooking = {}

      this.$store.dispatch('bookSlot', { ...mxLocationInfo })
      .then((data) => {
        if (data.result === 'ok') {
          newBooking.gameId = data.gameId
          newBooking.bookId = data.bookId
          return this.$store.dispatch('updateGameData', mxLocationInfo.gameId)
        }
        throw new Error('Cannot book')
      })
      .then(() => {
        this.$router.push({
          path: '/reservation',
          query: {
            gameId: newBooking.gameId,
            bookId: newBooking.bookId,
          }
        });
      })
      .catch(() => {
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
</style>

<style>
.btn-hidden {
  display: none;
}
@import '../assets/backarrow.css';
</style>

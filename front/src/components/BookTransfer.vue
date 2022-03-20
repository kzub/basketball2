<template>
  <div>
    <div v-if="!user" class="d-flex justify-content-center">
      <div class="spinner-border" role="status">
        <span class="sr-only">Загружается...</span>
      </div>
    </div>
    <div v-else-if="!user.auth || !user.name">
      <h4 class="my-5">
        Для передачи бронирования необходимо
      </h4>
      <Auth/>
    </div>
    <div v-else>
      <b-btn class="btn-lg mb-3 rounded-0" block @click="close" variant="warning">
        Закрыть
      </b-btn>

      <h3 class="py-3">
        Передача бронирования
      </h3>

      <div v-if="transferError" class="d-flex justify-content-center mx-3">
        <h4 v-if="gameDetails" class="btn-danger p-3 mt-3 rounded">
          Бронирование истекло
        </h4>
        <h4 v-else class="btn-danger p-3 mt-3 rounded">
          Ссылка недействительна
        </h4>
      </div>
      <div v-else-if="!gameDetails || !transferReservation" class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Загружается...</span>
        </div>
      </div>
      <div v-else class="px-3">
        <GameInfo :game="gameDetails.game" show="place,time"/>

        <b-button v-if="transferReservation.paymentStatus === 'paid'" variant="success"
                  class="w-75 mt-3 mb-3 p-3 justify-content-center">
          ОПЛАЧЕНО
        </b-button>
        <b-button v-else class="w-75 mt-3 mb-3 p-3 justify-content-center"
        variant="danger">
          НЕ ОПЛАЧЕНО
          <div v-if="reservationExpire"
               class="btn-danger">
               <hr style="background-color: white"/>
            на оплату есть<br> {{mxTextHoursMinutesTo(Date.now() + reservationExpire*60*1000)}}
          </div>
        </b-button>


        <b-form class="text-left">
          Участник:
          <b-form-input id="userName"  class="mt-2"
                        type="text"
                        v-model="transferReservation.playerName"
                        disabled
                        placeholder="Фамилия и имя">
          </b-form-input>
        </b-form>

        <hr/>

        <b-btn @click="doTransfer" class="my-4 w-100" variant="primary">
          <h5 class="mt-2">Перевести на себя</h5>
        </b-btn>
        <h6>
          Нажмите кнопку для продолжения
        </h6>
      </div>
    </div>
  </div>
</template>

<script>

import DateTime from '../mixins/datetime.js'
// import GameUtils from '../mixins/game.js'
import Auth from './Auth.vue'
import GameInfo from './GameInfo.vue'

let intExpId

export default {
  name: 'BookTransfer',
  mixins: [DateTime/*, GameUtils*/],
  components: {
    Auth,
    GameInfo,
  },
  mounted () {
    const self = this
    const { commit } = this.$store

    this.$store.dispatch('getTransferDetails', { rsvTransferCode: this.rsvTransferCode })
      .then(transferDetails => {
        if (!transferDetails) {
          self.transferError = true
          return
        }

        self.transferReservation = self.gameDetails.players
          .filter(rsv => rsv.bookId === transferDetails.bookId)
          .pop()

        if (!self.transferReservation) {
          self.transferError = true
          return
        }

        if (self.transferReservation.expireAt) {
          intExpId = setInterval(function() {
            commit('setReservationExpire', self.mxMinutesTo(self.transferReservation.expireAt))
          }, 1000)
        }
      })
  },
  destroyed: function () {
    if (intExpId) {
      clearInterval(intExpId)
    }
    this.$store.commit('setReservationExpire', undefined)
  },
  data () {
    return {
      transferError: undefined,
      transferReservation: undefined,
    }
  },
  computed: {
    user () {
      return this.$store.state.user
    },
    gameDetails () {
      return this.$store.state.gameDetails
    },
    reservationExpire: function() {
      return this.$store.state.reservationExpire ||
        (this.transferReservation && this.mxMinutesTo(this.transferReservation.expireAt))
    },
    rsvTransferCode () {
      return this.$router.currentRoute.query.c
    }
  },
  methods: {
    close: function() {
      window.close()
    },
    doTransfer() {
      const self = this
      this.$store.dispatch('doTransfer', { rsvTransferCode: this.rsvTransferCode })
      .then(result => {
        if (!result || !result.ok) {
          self.transferError = true
          return
        }

        self.$router.push({
          path: '/game',
          query: {
            gameId: self.transferReservation.gameId,
          }
        })
      })
    },
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

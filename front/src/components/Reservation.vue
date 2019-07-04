<template>
  <div>
    <div v-if="!viewDataUpdated || !mxGameDetails || !mxBookInfo" class="my-2">
      <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Загружается...</span>
        </div>
      </div>
    </div>

    <div v-else>
      <b-btn @click="back" class="btn-lg mb-3 rounded-0" block variant="warning">
        Назад
      </b-btn>

      <!-- game and payment info -->
      <GameInfo :game="mxGameDetails.game" show="place,time"/>
      <GameInfo :game="mxGameDetails.game" show="organizer"/>
      <GameInfo :game="mxGameDetails.game" show="payment"/>

      <b-button v-if="mxBookInfo.paymentStatus === 'paid'" variant="success"
      class="w-75 mt-3 mb-3 p-3 justify-content-center" >
        ОПЛАЧЕНО
      </b-button>
      <b-button v-else-if="mxBookInfo.status == 'waiting'" 
      class="w-75 mt-3 mb-3 p-3 justify-content-center">
        Резерв, на случай, если кто-то откажется
      </b-button>
      <b-button v-else class="w-75 mt-3 mb-3 p-3 justify-content-center" 
      variant="danger">
        НЕ ОПЛАЧЕНО
        <div v-if="reservationExpire"
             class="btn-danger">
             <hr style="background-color: white"/>
          на оплату есть {{ reservationExpire }}
        </div>
      </b-button>

      <div class="mb-4 px-3">
        <b-form @submit="onPaySubmit">
        </b-form>
        <!-- player details -->
        <div class="text-left">
          Участник:
          <b-form-input id="userName"  class="mt-2"
                        type="text"
                        v-model="form.name"
                        required
                        placeholder="Фамилия и имя">
          </b-form-input>
          <b-form-input v-if="isAdmin" class="mt-2"
                        id="userPhone"
                        type="text"
                        v-model="form.phone"
                        required
                        disabled
                        placeholder="Номер телефона">
          </b-form-input>
        </div>
        <hr/>

        <!-- admin action buttons -->
        <div v-if="isAdmin" class="mt-3 d-flex flex-column">
          <b-btn @click="changeName" class="my-1" variant="primary">Изменить имя</b-btn>

          <b-btn v-if="mxBookInfo.paymentStatus === 'paid'" 
                 @click="changePay" class="my-1" variant="warning">
            Пометить не оплаченным
          </b-btn>
          <b-btn v-else 
                 @click="changePay" class="my-1" variant="success">
            Пометить оплаченым
          </b-btn>

          <b-btn class="my-1" variant="danger" v-b-modal.ackModal>Удалить запись</b-btn>
        </div>

        <!-- users action buttons -->
        <div v-else class="mt-3 d-flex flex-column">
          <b-btn v-if="mxGameDetails.game.paymentType === 'prepay' && 
                       mxBookInfo.paymentStatus !== 'paid' && 
                       mxBookInfo.status !== 'waiting'"
                 @click="makePayment" class="my-1" variant="success">
            Оплатить
          </b-btn>
          <b-btn v-if="mxGameDetails.game.status == 'settled' && 
                       mxGameDetails.game.paymentType === 'shared' && 
                       mxBookInfo.paymentStatus !== 'paid'" 
                 @click="informAboutPayment" class="my-1" variant="success">
            Сообщить об оплате
          </b-btn>
          <b-btn @click="changeName" class="my-1" variant="primary">
            Изменить имя
          </b-btn>
          <b-btn v-if="(mxGameDetails.game.paymentType === 'prepay' &&
                       mxBookInfo.paymentStatus !== 'paid')  || 
                       (mxGameDetails.game.paymentType === 'shared' &&
                       mxGameDetails.game.status !== 'settled')"
                       class="my-1" variant="danger" v-b-modal.ackModal>
              Отказаться от записи
          </b-btn>
        </div>

        <!-- delete confirmation window -->
        <div>
          <b-modal id="ackModal" title="Подтверждение" ok-variant="danger" ok-title="Да" cancel-title="Отмена"
            @ok="handleDeleteOk">
            <p class="my-4">Удалить запись?</p>
          </b-modal>
        </div>
      </div>

    </div>
  </div>
</template>

<script>

import DateTime from '../mixins/datetime.js'
import GameUtils from '../mixins/game.js'
import Organizer from './Organizer.vue'
import GameInfo from './GameInfo.vue'

let intervalId;

export default {
  name: 'Pay',
  mixins: [DateTime, GameUtils],
  components: {
    Organizer,
    GameInfo,
  },
  mounted: function () {
    const { commit, state } = this.$store
    const self = this;
    intervalId = setInterval(function() {
      if (self.mxBookInfo && self.mxBookInfo.expireTime) {
        commit('setReservationExpire', self.mxMinutesTo(self.mxBookInfo.expireTime))
      }
    }, 1000)
  },
  destroyed: function () {
    clearInterval(intervalId)
    this.$store.state.reservationExpire = undefined
  },
  computed: {
    reservationExpire: function() {
        return this.$store.state.reservationExpire || 
               this.mxMinutesTo(this.mxBookInfo.expireTime)
    },
    form: function () {
      return {
        phone: this.bookingPhone,
        name: this.mxBookInfo.playerName,
        code: '',
      }
    },
    isAdmin: function () {
      return this.$store.state.user && this.$store.state.user.userId === this.mxGameDetails.game.organizer.userId
    },
    bookingPhone: function () {
      if (this.$store.state.gameDetails && this.$store.state.gameDetails.users) {
        return this.$store.state.gameDetails.users.filter(u =>
          u.userId === this.mxBookInfo.userId)[0]
        .phone
      }
      return this.$store.state.user && this.$store.state.user.phone
    },
    isCancelable: function () {
      return !(this.game.paymentType === 'prepay' && this.mxBookInfo.paymentStatus === 'paid')
    },
    user () {
      return this.$store.state.user
    },
    viewDataUpdated () {
      return this.$store.state.viewDataUpdated
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
    changeName: function() {
      this.$store.dispatch('updateReservationName', {
        ...this.mxLocationInfo,
        name: this.form.name
      })
      .then(this.back)
    },
    changePay: function() {
      this.$store.dispatch('updateReservationPay', {
        ...this.mxLocationInfo,
      })
      .then(this.back)
    },
    makePayment: function() {
      console.log('makePayment');
    },
    informAboutPayment: function() {
      console.log('informAboutPayment');
    },
    onPaySubmit: function (evt) {
      console.log('change', evt)
      evt.preventDefault()
    },
    handleDeleteOk: function () {
      this.$store.dispatch('deleteReservation', {
        ...this.mxLocationInfo,
      })
      .then(this.back)
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

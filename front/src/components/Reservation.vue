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
        <div class="arrow-left"><i class="left"></i></div>
        <span>Назад</span>
      </b-btn>

      <!-- game and payment info -->
      <GameInfo :game="mxGameDetails.game" show="place,time"/>

      <b-button v-if="mxBookInfo.paymentStatus === 'paid'" variant="success"
                class="w-75 mt-3 mb-3 p-3 justify-content-center">
        ОПЛАЧЕНО
        <div v-if="!isPaymentGatewayUsed && isAdmin">
          (ручной режим)
        </div>
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
          на оплату есть {{ reservationExpire }} {{mxTextMinutesTo(reservationExpire)}}
        </div>
      </b-button>

      <div class="mb-4 px-3">
        <!-- player details -->
        <b-form class="text-left">
          Участник:
          <b-form-input id="userName"  class="mt-2"
                        type="text"
                        v-model="form.name"
                        disabled
                        placeholder="Фамилия и имя">
          </b-form-input>
          <b-form-input class="mt-2"
                        id="userPhone"
                        type="text"
                        v-model="bookingPhone"
                        disabled
                        placeholder="Номер телефона">
          </b-form-input>
        </b-form>
        <hr/>

        <!-- admin action buttons -->
        <div v-if="isAdmin" class="mt-3 d-flex flex-column">
          <b-btn v-b-modal.chgName class="my-1" variant="primary">Изменить имя</b-btn>

          <div v-if="!isPaymentGatewayUsed" class="d-flex flex-column">
            <b-btn v-if="mxBookInfo.paymentStatus === 'paid'"
                   @click="changePay" class="my-1" variant="warning">
              Не оплачено
            </b-btn>
            <b-btn v-if="mxBookInfo.paymentStatus !== 'paid'"
              @click="changePay" class="my-1" variant="success">
              Оплачено
            </b-btn>
            <b-btn v-if="mxBookInfo.paymentStatus !== 'paid' &&
                         mxBookInfo.status === 'reserved' &&
                         mxGameDetails.game.paymentType === 'prepay'"
              @click="clearExpire" class="my-1" variant="warning">
              Убрать лимит на оплату
            </b-btn>
          </div>

          <b-btn v-b-modal.ackModal class="my-1 mb-5" variant="danger">Удалить запись</b-btn>
        </div>

        <!-- users action buttons -->
        <div v-else class="mt-3 mb-4">
          <div class="d-flex flex-column">
            <h5 class="font-weight-bold text-right mt-2 mb-3" >
              <GameInfo :game="mxGameDetails.game" show="payment"/>
            </h5>

            <div v-if="isFullPayByCreditsAvailable">
              <div class="w-100 my-3 rounded btn-warning">
                <h5 class="py-2">Счет предоплаты: {{creditsTotal}} ₽</h5>
              </div>
              <hr/>
              <b-btn @click="payByCredits" class="my-1 w-100" variant="success">
                Оплатить со счета предоплаты
              </b-btn>
            </div>
            <div v-else-if="isPartialPayByCreditsAvailable">
              <div class="w-100 my-3 rounded btn-warning">
                <h5 class="py-2">Счет предоплаты: {{creditsTotal}} ₽</h5>
              </div>
              <hr/>
              <PayButton
                :account="mxGameDetails.game.paymentGateAccount"
                :message="mxGameDetails.game.paymentGateMessage"
                :amount="mxGameDetails.game.paymentAmount - creditsToUse"
                :label="paymentId"
                :buttonText="`Оплатить ${mxGameDetails.game.paymentAmount - creditsToUse} ₽`"
              />
            </div>
            <div v-else-if="isPayAvailable">
              <hr/>
              <PayButton
                :account="mxGameDetails.game.paymentGateAccount"
                :message="mxGameDetails.game.paymentGateMessage"
                :amount="mxGameDetails.game.paymentAmount"
                :label="paymentId"
                :buttonText="`Оплатить ${mxGameDetails.game.paymentAmount} ₽`"
              />
            </div>
            <!-- <b-btn v-if="mxGameDetails.game.status == 'settled' &&
                         mxGameDetails.game.paymentType === 'shared' &&
                         mxBookInfo.paymentStatus !== 'paid'"
                   @click="informAboutPayment" class="my-1" variant="success">
              Сообщить об оплате
            </b-btn> -->
            <b-btn v-b-modal.chgName class="my-1" variant="primary">
              Изменить имя
            </b-btn>
            <b-btn class="my-1 mb-5" variant="danger" v-b-modal.ackModal>
              Отказаться от записи
            </b-btn>
          </div>
          <hr/>
          <h5 class="mt-4 mb-5">
            <GameInfo :game="mxGameDetails.game" show="organizer"/>
          </h5>
          <hr/>
        </div>
        <!-- delete confirmation window -->
        <div>
          <b-modal id="ackModal" title="Подтверждение" ok-variant="danger" ok-title="Да" cancel-title="Отмена"
            @ok="handleDeleteOk">
            <div v-if="mxGameDetails.game.paymentType === 'prepay'" class="my-2">
                <a class="dotted" v-b-modal.payReturnInfo>Прочитайте условия возврата</a>
            </div>
            <p class="my-4">
              Удалить запись?
            </p>
            <b-modal id="payReturnInfo" cancel-variant="hidden" title="Условия возврата" class="flex">
              <RefundRules/>
            </b-modal>
          </b-modal>
        </div>
        <!-- change name window -->
        <div>
          <b-modal id="chgName" title="Введите участника" ok-variant="danger" ok-title="Ок" cancel-title="Отмена"
            @ok="handleChangeOk">
            <b-form class="text-left">
              <b-form-input id="userName"  class="mt-2"
                            type="text"
                            v-model="form.name"
                            required
                            placeholder="Фамилия и имя">
              </b-form-input>
            </b-form>
          </b-modal>
        </div>
      </div>

    </div>
  </div>
</template>

<script>

import DateTime from '../mixins/datetime.js'
import GameUtils from '../mixins/game.js'
import GameInfo from './GameInfo.vue'
import PayButton from './PayButton.vue'
import RefundRules from './RefundRules.vue'

let intervalId;

export default {
  name: 'Reservation',
  mixins: [DateTime, GameUtils],
  components: {
    GameInfo,
    PayButton,
    RefundRules,
  },
  mounted: function () {
    const { commit } = this.$store
    const self = this;
    intervalId = setInterval(function() {
      if (self.mxBookInfo && self.mxBookInfo.expireAt) {
        commit('setReservationExpire', self.mxMinutesTo(self.mxBookInfo.expireAt))
      }
    }, 1000)
  },
  destroyed: function () {
    clearInterval(intervalId)
    this.$store.commit('setReservationExpire', undefined)
  },
  computed: {
    reservationExpire: function() {
        return this.$store.state.reservationExpire || this.mxMinutesTo(this.mxBookInfo.expireAt)
    },
    form: function () {
      return {
        name: this.mxBookInfo.playerName,
        code: '',
      }
    },
    isAdmin: function () {
      return this.$store.state.user && this.$store.state.user.userId === this.mxGameDetails.game.organizer.userId
    },
    isPaymentGatewayUsed: function () {
      return this.mxBookInfo.paymentId > 0
    },
    isPayAvailable: function () {
      if (!this.mxBookInfo || !this.mxGameDetails) {
        return
      }
      return this.mxGameDetails.game.paymentType === 'prepay' &&
             this.mxBookInfo.paymentStatus !== 'paid' &&
             this.mxBookInfo.status !== 'waiting'
    },
    creditsTotal: function () {
      return this.mxGameDetails.creditsTotal || 0
    },
    creditsToUse: function () {
      return this.mxGameDetails.creditsToUse || 0
    },
    isFullPayByCreditsAvailable: function () {
      return this.isPayAvailable && (this.creditsToUse >= this.mxGameDetails.game.paymentAmount)
    },
    isPartialPayByCreditsAvailable: function () {
      return this.isPayAvailable && (this.creditsToUse > 0)
    },
    paymentId: function () {
      return this.user && this.mxBookInfo &&
        ['RSV', this.mxBookInfo.gameId, this.mxBookInfo.bookId, this.user.userId, this.creditsToUse].join('|')
    },
    bookingPhone: function () {
      if (this.$store.state.gameDetails && this.$store.state.gameDetails.users) {
        const user = this.$store.state.gameDetails.users.filter(u =>
          u.userId === this.mxBookInfo.userId)[0]
        return user && user.phone
      }
      return this.$store.state.user && this.$store.state.user.phone
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
    changePay: function() {
      this.$store.dispatch('changeReservationPay', {
        ...this.mxLocationInfo,
      })
    },
    clearExpire: function() {
      this.$store.dispatch('clearReservationExpire', {
        ...this.mxLocationInfo,
      }).then(() => {
        this.$store.commit('setReservationExpire', undefined)
      })
    },
    informAboutPayment: function() {
      // console.log('informAboutPayment');
    },
    payByCredits: function () {
      this.$store.dispatch('payByCredits', {
        ...this.mxLocationInfo,
      })
    },
    handleChangeOk: function() {
      if(!this.form.name) {
        return
      }
      this.$store.dispatch('updateReservationName', {
        ...this.mxLocationInfo,
        name: this.form.name
      })
    },
    handleDeleteOk: function () {
      this.$store.dispatch('deleteReservation', { ...this.mxLocationInfo })
      .then(() => { this.$store.dispatch('getUserInfo') })
      .then(this.back)
    }
  },
}
</script>

<style scoped>
.manualPayment {
  /*border: 2px dotted #dc3545;*/
  border-left: 6px solid #ffc207 !important;
  border-right: 6px solid #ffc207 !important;
}
.dotted {
  border: 2px dotted #007bff;
  border-style: none none dotted;
  color: #007bff !important;
  /*background-color: #fff;*/
}
</style>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
@import '../assets/backarrow.css';
</style>

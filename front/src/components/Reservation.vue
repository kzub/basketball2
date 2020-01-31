<template>
  <div>
    <b-btn @click="back" class="btn-lg mb-3 rounded-0" block variant="warning">
      <div class="arrow-left"><i class="left"></i></div>
      <span>Назад</span>
    </b-btn>

    <div v-if="!viewDataUpdated || !mxGameDetails || !mxBookInfo || !user" class="my-2">
      <div class="d-flex justify-content-center">
        <div class="spinner-border mt-3" role="status">
          <span class="sr-only">Загружается...</span>
        </div>
      </div>
    </div>

    <div v-else>
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
          на оплату есть<br> {{mxTextHoursMinutesTo(Date.now() + reservationExpire*60*1000)}}
        </div>
      </b-button>

      <div v-if="reservationExpire < 0" class="mt-3">
        <h4>Время на оплату истекло</h4>
      </div>
      <div v-else class="mb-4 px-3">
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
              <hr/>
              <div class="text-right my-3">
                <h5 class="py-2">Ваш счет предоплаты: {{creditsTotal}} р.</h5>
              </div>
              <b-btn @click="payByCredits" class="my-1 w-100" variant="success">
                Оплатить со счета предоплаты
              </b-btn>
            </div>
            <div v-else-if="isPartialPayByCreditsAvailable">
              <hr/>
              <div class="text-right my-3">
                <h5 class="py-2">Ваш счет предоплаты: {{creditsTotal}} р.</h5>
              </div>
              <PayButton
                :account="mxGameDetails.game.paymentGateAccount"
                :message="mxGameDetails.game.paymentGateMessage"
                :amount="mxGameDetails.game.paymentAmount - creditsToUse"
                :label="paymentLabel"
                :buttonText="`Оплатить ${mxGameDetails.game.paymentAmount - creditsToUse} р.`"
                :retQueryParams="`gameId=${mxGameDetails.game.gameId}`"
              />
            </div>
            <div v-else-if="isPayAvailable">
              <hr/>
              <PayButton
                :account="mxGameDetails.game.paymentGateAccount"
                :message="mxGameDetails.game.paymentGateMessage"
                :amount="mxGameDetails.game.paymentAmount"
                :label="paymentLabel"
                :buttonText="`Оплатить ${mxGameDetails.game.paymentAmount} р.`"
                :retQueryParams="`gameId=${mxGameDetails.game.gameId}`"
              />
            </div>
            <div v-else>
              <hr/>
            </div>
            <div>
              <b-btn v-b-modal.chgName class="my-1 w-100" variant="primary">
                Изменить имя игрока
              </b-btn>
            </div>
            <div>
              <b-btn v-b-modal.transferPlayer v-if="isTransferable" class="my-1 w-100" variant="warning">
                Передать запись другому игроку
              </b-btn>
            </div>
            <div>
              <b-btn v-b-modal.ackModal class="my-1 w-100" variant="danger">
                Отказаться от записи
              </b-btn>
            </div>
          </div>
          <hr/>
          <h5 class="mt-4 mb-5">
            <GameInfo :game="mxGameDetails.game" show="organizer"/>
          </h5>
        </div>
        <!-- transfer reservation window -->
        <div>
          <b-modal id="transferPlayer" title="Передать свою запись" ok-title="Понятно" cancel-variant="hidden">
            <p class="my-4">
              Можно передать свою запись другому зарегистрированному игроку. Для этого, скопируйте и отправьте ссылку человеку, которому хотите передать свою бронь, любым доступным способом. Пройдя по ссылке, получатель сможет запустить процесс передачи этой записи себе.
            </p>

            <div class="d-flex justify-content-center">
              <a v-if="transferLink" class="dotted w-100" :href="transferLink" target="_blank">
                {{transferLink}}
              </a>
              <div v-else-if="linkIsLoading" class="spinner-border mt-3" role="status">
                <span class="sr-only">Загружается...</span>
              </div>
              <div v-else>
                <b-btn class="px-5 my-3" @click="getRsvTrnsfrLink">Получить ссылку</b-btn>
              </div>
            </div>
          </b-modal>
        </div>
        <!-- delete confirmation window -->
        <div>
          <b-modal id="ackModal" title="Подтверждение" ok-variant="danger" ok-title="Да" cancel-title="Отмена"
            @ok="handleDeleteOk">
            <RefundRules v-if="isRefundable"/>
            <p class="my-4">
              Удалить запись?
            </p>
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

let intervalId

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
    const self = this

    intervalId = setInterval(function() {
      if (self.mxBookInfo && self.mxBookInfo.expireAt) { // должно быть внутри, потому что данные появляются не сразу
                                                         // при монтировании элемента
        commit('setReservationExpire', self.mxMinutesTo(self.mxBookInfo.expireAt))
      }
    }, 1000)

    commit('rsvTransferCode', undefined)
  },
  destroyed: function () {
    if (intervalId) {
      clearInterval(intervalId)
    }
    this.$store.commit('setReservationExpire', undefined)
  },
  data() {
    return {
      linkIsLoading: false
    }
  },
  computed: {
    reservationExpire: function() {
      if (this.mxBookInfo.expireAt > 0 && this.mxBookInfo.expireAt < Date.now()) {
        return -1
      }
      return this.$store.state.reservationExpire || this.mxMinutesTo(this.mxBookInfo.expireAt)
    },
    form: function () {
      return {
        name: this.mxBookInfo.playerName,
        code: '',
      }
    },
    isAdmin: function () {
      return this.user.userId === this.mxGameDetails.game.organizer.userId
    },
    isPaymentGatewayUsed: function () {
      return this.mxBookInfo.paymentId > 0
    },
    isPayAvailable: function () {
      return this.mxGameDetails.game.paymentType === 'prepay' &&
             this.mxBookInfo.paymentStatus !== 'paid' &&
             this.mxBookInfo.status !== 'waiting'
    },
    isRefundable: function () {
      return this.mxGameDetails.game.paymentType === 'prepay' &&
             this.mxBookInfo.paymentStatus === 'paid'
    },
    isTransferable: function () {
      return this.mxBookInfo.status === 'booked' || this.mxBookInfo.status === 'reserved'
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
    paymentLabel: function () {
      return [this.user.payEnv, 'RSV', this.mxBookInfo.gameId, this.mxBookInfo.bookId, this.user.userId, this.creditsToUse].join('|')
    },
    bookingPhone: function () {
      if (this.mxGameDetails.users) {
        const user = this.mxGameDetails.users.filter(u => u.userId === this.mxBookInfo.userId).pop()
        return user && user.phone
      }
      return this.user && this.user.phone
    },
    transferLink () {
      if (!this.$store.state.rsvTransferCode) {
        return
      }
      return [document.location.origin, this.$store.state.rsvTransferCode].join('/#/bookTransfer/?c=')
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
    payByCredits: function () {
      this.$store.dispatch('payByCredits', {
        ...this.mxLocationInfo,
      })
      .then((res) => {
        if (res) {
          this.$router.push({
            path: '/success',
            query: {
              gameId: this.mxLocationInfo.gameId,
            },
          })
        }
      })
    },
    getRsvTrnsfrLink: function () {
      this.linkIsLoading = true
      this.$store.dispatch('getTransferCode', { ...this.mxLocationInfo })
      .then(() => { this.linkIsLoading = false })
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
      let refundAmount;
      this.$store.dispatch('deleteReservation', { ...this.mxLocationInfo })
      .then((res) => {
        refundAmount = res && res.refundAmount
        this.$store.dispatch('getUserInfo')
      })
      .then(() => {
        if (refundAmount) {
          if (this.isAdmin) {
            this.$router.push({
              path: '/credits',
              query: {
                refundAmount,
                playerName: this.mxBookInfo.playerName,
              },
            })
            return
          }

          this.$router.push({
            path: '/myCredits',
            query: {
              refundAmount,
            },
          })
          return
        }
        this.back()
      })
    }
  },
}
</script>

<style scoped>
.dotted {
  border: 2px dotted #007bff;
  border-style: none none dotted;
  color: #007bff !important;
  overflow: scroll;
}
</style>

<style>
@import '../assets/backarrow.css';
</style>

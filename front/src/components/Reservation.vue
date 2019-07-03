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
      <b-btn class="btn-lg mb-3 rounded-0" block @click="back" variant="warning">
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
      <b-button v-else-if="mxBookInfo.type == 'waiter'" 
      class="w-75 mt-3 mb-3 p-3 justify-content-center">
        Резерв, на случай, если кто-то откажется
      </b-button>
      <b-button v-else class="w-75 mt-3 mb-3 p-3 justify-content-center" 
      variant="danger">
        НЕ ОПЛАЧЕНО
        <div v-if="reservationExpire && mxGameDetails.game.paymentType === 'prepay' && 
                   mxBookInfo.status !== 'booked'"
             class="btn-danger">
             <hr style="background-color: white"/>
          на оплату есть {{ reservationExpire }}
        </div>
      </b-button>

      <div class="mb-4 px-3">
        <b-form @submit="onPaySubmit">
          <!-- player details -->
          <div class="text-left">
            Участник:
            <b-form-group id="userName"
                          label-for="userName">
              <b-form-input id="userName"
                            type="text"
                            v-model="form.name"
                            required
                            placeholder="Фамилия и имя">
              </b-form-input>
            </b-form-group>
            <b-form-group v-if="isAdmin" id="phoneNumber"
                            label-for="userPhone">
                <b-form-input id="userPhone"
                              type="number"
                              v-model="form.phone"
                              required
                              disabled
                              placeholder="Номер телефона">
                </b-form-input>
              </b-form-group>
          </div>
          <hr/>

          <!-- admin action buttons -->
          <div v-if="isAdmin" class="mt-3 d-flex flex-column">
            <b-btn class="my-1" type="submit" variant="primary">Изменить имя</b-btn>

            <b-btn v-if="mxBookInfo.paymentStatus === 'paid'" 
                   class="my-1" type="submit" variant="warning">
              Пометить не оплаченным
            </b-btn>
            <b-btn v-else class="my-1" type="submit" variant="success">
              Пометить оплаченым
            </b-btn>

            <b-btn class="my-1" variant="danger" v-b-modal.ackModal>Удалить запись</b-btn>
          </div>

          <!-- users action buttons -->
          <div v-else class="mt-3 d-flex flex-column">
            <b-btn v-if="mxGameDetails.game.paymentType === 'prepay' && 
                         mxBookInfo.paymentStatus !== 'paid' && 
                         mxBookInfo.type !== 'waiter'"
                         class="my-1" type="submit" variant="success">
              Оплатить
            </b-btn>
            <b-btn v-if="mxGameDetails.game.status == 'settled' && 
                         mxGameDetails.game.paymentType === 'shared' && 
                         mxBookInfo.paymentStatus !== 'paid'" 
                         class="my-1" type="submit" variant="success">
              Сообщить об оплате
            </b-btn>
            <b-btn class="my-1" type="submit" variant="primary">
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

        </b-form>
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
      if (self.mxBookInfo) {
        commit('setReservationExpire', self.mxMinutesTo(self.mxBookInfo.ts + this.$store.state.gameDetails.game.props.timeForPayment))
      }
    }, 5000)
  },
  destroyed: function () {
    clearInterval(intervalId)
    this.$store.state.reservationExpire = undefined
  },
  computed: {
    reservationExpire: function() {
      return this.$store.state.reservationExpire || this.mxMinutesTo(this.mxBookInfo.ts + this.$store.state.gameDetails.game.props.timeForPayment)
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
      return !(this.game.paymentType === 'prepay' && this.mxBookInfo.type === 'paid')
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
    onPaySubmit: function (evt) {
      console.log('change', evt)
      evt.preventDefault()
    },
    handleDeleteOk: function () {
      console.log('delete')
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

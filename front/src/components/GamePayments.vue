<template>
  <div>
    <h3 class="btn-warning py-2">
      Оплата
    </h3>
    <div v-if="gameLoadError">
      <div class="mt-4 mb-5">
        <p>Страница недоступна</p>
      </div>
    </div>
    <div v-else-if="!viewDataUpdated || !mxGameDetails || !user" class="my-2">
      <div class="d-flex justify-content-center flex-wrap-reverse loader">
        <div class="spinner-border" role="status">
          <span class="sr-only">Загружается...</span>
        </div>
      </div>
    </div>
    <div v-else class="mx-3">
      <GameInfo :game="mxGameDetails.game" show="place,time"/>

      <div v-if="unpaidPlayers.length">
        <div class="text-left mt-3">Ожидается оплата:</div>
        <div class="my-2">
          <div class="w-100" v-for="(slot, index) in unpaidPlayers" :key="'p'+index">
            <PayButton
              :onSubmit="confirmPay(slot)"
              :account="mxGameDetails.game.paymentGateAccount"
              :message="mxGameDetails.game.paymentGateMessage"
              :amount="mxGameDetails.game.paymentAmount"
              :label="paymentLabel(slot)"
              :buttonText="slot.playerName"
            />
          </div>
        </div>
      </div>
      <div v-else>
        <b-button class="my-3 w-100" variant="success">
          <h5 class="pt-2 pb-1">Все места оплачены</h5>
        </b-button>
      </div>

      <hr class="mt-4"/>
      <h5 class="text-left">
        <div v-if="paymentType == 'prepay'">
          <div>Игроков пришло: {{totalPlayers}}</div>
          Стоимость участия: {{ mxGameDetails.game.paymentAmount }} р.
        </div>
        <div v-else-if="paymentType == 'shared'">
          <div>Игроков пришло: {{totalPlayers}}</div>
          <div>Стоимость зала: {{mxGameDetails.game.paymentAmount}} р.</div>
          <div>Стоимость участия: {{ Math.ceil(mxGameDetails.game.paymentAmount / totalPlayers) }} р.</div>
        </div>
      </h5>

      <div class="text-left">
        <hr/>
        <GameInfo :game="mxGameDetails.game" show="organizer"/>
      </div>

      <div class="mt-4 mb-5">
        <b-btn v-if="mxGameDetails.game.chatLink"
        :href="mxGameDetails.game.chatLink"
        class="mt-2" block variant="warning">
        Чат в телеграм <div class="arrow"><i class="right"></i></div>
      </b-btn>

      <b-modal id="confirm-pay-modal" title="Подтверждение"
               ok-variant="success" ok-title="Оплатить" cancel-title="Отмена"
               @ok="confirmPayOk">
        <p class="my-4">
          Оплатить за {{selectedPlayer}} ?
        </p>
      </b-modal>
    </div>
  </div>

</div>
</template>

<script>
  import GameUtils from '../mixins/game.js'
  import GameInfo from './GameInfo.vue'
  import PayButton from './PayButton.vue'

  export default {
    name: 'Game',
    mixins: [GameUtils],
    components: {
      GameInfo,
      PayButton,
    },
    data () {
      return {
        selectedPlayer: undefined,
        selectedSubmitFn: undefined
      }
    },
    computed: {
      gameLoadError () {
        return this.mxGameDetails && this.mxGameDetails.error
      },
      viewDataUpdated () {
        return this.$store.state.viewDataUpdated
      },
      totalPlayers () {
        return this.mxGameDetails.game.usedPlayerSlots || 1
      },
      paymentType () {
        return this.mxGameDetails.game.paymentType
      },
      unpaidPlayers () {
        return this.mxGameDetails.players.filter(slot => slot.bookId != 0 && slot.paymentStatus != 'paid')
      },
      user () {
        return this.$store.state.user
      },
    },
    methods: {
      confirmPay (slot) {
        let self = this
        return function (submit) {
          self.selectedPlayer = slot.playerName
          self.selectedSubmitFn = submit
          self.$bvModal.show('confirm-pay-modal');
        }
      },
      confirmPayOk () {
        this.selectedSubmitFn()
      },
      paymentLabel (slot) {
        return [this.user.payEnv, 'RPP', slot.gameId, slot.bookId, slot.userId].join('|')
      },
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.loader {
  height: 150px;
}
</style>
<style>
@import '../assets/backarrow.css';
</style>

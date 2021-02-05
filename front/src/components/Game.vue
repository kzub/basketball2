<template>
  <div>
    <b-btn @click="back" class="btn-lg mb-3 rounded-0" block variant="warning">
      <div class="arrow-left"><i class="left"></i></div>
      <span>Назад</span>
    </b-btn>

    <div v-if="!viewDataUpdated || !mxGameDetails || !user" class="my-2">
      <div class="d-flex justify-content-center flex-wrap-reverse loader">
        <div class="spinner-border" role="status">
          <span class="sr-only">Загружается...</span>
        </div>
      </div>
    </div>
    <div v-else>
      <!-- game and payment info -->
      <GameInfo :game="mxGameDetails.game" show="place,time,openMode"/>

      <div v-if="mxGameDetails.game.freePlayerSlots == 0"
           class="card-title btn-danger p-2 mx-3 rounded">
        Свободных мест нет
      </div>

      <div>
        <div class="text-left m-2">Список игроков:</div>
        <div v-for="(slot, index) in mxGameDetails.players" :key="'p'+index">
          <router-link class="d-flex" :to="goLink(mxGameDetails.game, slot)" tag="div">
            <b-button :class="playerBorderColor(slot) + ' my-1 mx-3 slot'" :variant="playerColor(slot)">
              <div v-if="modifyAllowed(slot)">
                <span class="arrow-text">{{ slot.playerName }}</span>
                <span class="arrow"><i class="right"></i></span>
              </div>
              <div v-else>{{ slot.playerName }}</div>
            </b-button>
          </router-link>
        </div>

        <div class="mt-4" v-if="mxGameDetails.waiters.length">
          <div class="text-left m-2">Список запасных:</div>
          <div v-for="(slot, index) in mxGameDetails.waiters" :key="'r'+index">
            <router-link class="d-flex" :to="goLink(mxGameDetails.game, slot)" tag="div">
              <b-button class="my-1 mx-3 slot" :variant="playerColor(slot)">
                <div v-if="modifyAllowed(slot)">
                  <span class="arrow-text">{{ slot.playerName }}</span>
                  <span class="arrow"><i class="right"></i></span>
                </div>
                <div v-else>{{ slot.playerName }}</div>
              </b-button>
            </router-link>
          </div>
        </div>
      </div>

      <div class="text-left px-3">
        <hr/>
        <GameInfo :game="mxGameDetails.game" show="organizer"/>
        <GameInfo :game="mxGameDetails.game" show="payment"/>
      </div>
      <div v-if="isAdmin" class="m-1 mx-2 mt-4 mb-4">
        <div class="m-1 p-2 mx-2 rounded adminMode">
          Режим администратора
        </div>
        <div class="m-1 mx-2 mt-2 mb-4">
          <b-button v-if="showAdminButtons('disable')"
            v-b-modal.ackModal
            @click="changeGameStatus('disabled')"
            class="w-100 py-2 my-1" variant="danger">
            Отменить игру
          </b-button>
          <b-button v-if="showAdminButtons('settle')"
            v-b-modal.ackModal
            @click="changeGameStatus('settled')"
            class="w-100 py-2 my-1" variant="danger">
            Включить запись
          </b-button>
          <b-button v-if="showAdminButtons('disableAutoOpen')"
            @click="disableAutoOpen"
            class="w-100 py-2 my-1" variant="primary">
            Отменить авто открытие
          </b-button>
          <b-button
            v-if="showAdminButtons('askToPay')"
            @click="askToPay"
            class="w-100 py-2 my-1" variant="success">
            Напомнить об оплате
          </b-button>
          <b-button
            @click="sendPlayersList"
            class="w-100 py-2 my-1" variant="success">
            Прислать список игроков
          </b-button>
        </div>
      </div>
      <div class="mt-4 mb-5 px-3">
        <hr/>
        <router-link :to="'/map?gameId=' + mxGameDetails.game.gameId">
          <b-btn class="mt-2" block variant="warning">
            Место проведения <div class="arrow"><i class="right"></i></div>
          </b-btn >
        </router-link>
        <b-btn v-if="mxGameDetails.game.chatLink"
               :href="mxGameDetails.game.chatLink"
               class="mt-2" block variant="warning">
          Чат в телеграм <div class="arrow"><i class="right"></i></div>
        </b-btn>
      </div>

      <b-modal id="ackModal" title="Подтверждение"
        ok-variant="danger" ok-title="Да" cancel-title="Отмена"
        @ok="actionConfirmed">
        <p class="my-4">Изменить режим?</p>
      </b-modal>
    </div>

  </div>
</template>

<script>

import GameUtils from '../mixins/game.js'
import GameInfo from './GameInfo.vue'

export default {
  name: 'Game',
  mixins: [GameUtils],
  components: {
    GameInfo,
  },
  data: function () {
    return {
      action: ''
    }
  },
  mounted: function(){
    this.$store.dispatch('updateGameData', this.mxLocationInfo.gameId);
  },
  computed: {
    isAdmin () {
      return this.user.userId === this.mxGameDetails.game.organizer.userId
    },
    user () {
      return this.$store.state.user
    },
    viewDataUpdated () {
      return this.$store.state.viewDataUpdated
    },
  },
  methods: {
    playerColor: function (slot) {
      if (slot.status == 'free4player') return 'primary'
      if (slot.status == 'free4waiter') return 'secondary'
      if (slot.paymentStatus == 'paid') return 'success'
      if (slot.paymentStatus == 'unpaid') return 'warning'
      return 'danger'
    },
    playerBorderColor: function (slot) {
      if (slot.paymentStatus == 'paid' && !slot.paymentId) {
        return 'manualPaid'
      }
    },
    showAdminButtons (button) {
      if (button === 'settle' && this.mxGameDetails.game.status === 'disabled') {
        return true
      }
      if (button === 'disable' && this.mxGameDetails.game.status === 'settled') {
        return true
      }
      if (button === 'askToPay' && this.mxGameDetails.game.paymentGateAccount) {
        return this.mxGameDetails.players.filter(rsv => rsv.ts > 0 && rsv.paymentStatus !== 'paid').length > 0
      }
      if (button === 'disableAutoOpen' && this.mxGameDetails.game.openingMode === 'auto' && this.mxGameDetails.game.status === 'disabled') {
        return true
      }
    },
    back: function() {
      if (this.$store.state.myGamesOnly) {
        this.$router.push({
          path: '/myGames',
        })
        return
      }
      this.$router.push({
        path: '/',
      })
    },
    changeGameStatus (status) {
      this.action = status
    },
    sendPlayersList () {
      this.$store.dispatch('sendPlayersList', {
        gameId: this.mxGameDetails.game.gameId,
      });
    },
    askToPay () {
      this.$store.dispatch('askToPay', {
        gameId: this.mxGameDetails.game.gameId,
      });
    },
    disableAutoOpen () {
      this.$store.dispatch('disableAutoOpen', {
        gameId: this.mxGameDetails.game.gameId,
      });
    },
    actionConfirmed () {
      this.$store.dispatch('changeGameStatus', {
        gameId: this.mxGameDetails.game.gameId,
        status: this.action,
      })
    },
    modifyAllowed (slot) {
      if (slot.status.startsWith('free')) {
        return true
      }
      return (this.user && this.user.userId == slot.userId) || this.isAdmin
    },
    goLink (game, slot) {
      let freeSlotType;
      if (slot.status.startsWith('free4')) {
        freeSlotType = slot.status.slice(5)
      }

      if (!this.$store.state.user.auth) {
        let retUrl;
        if (freeSlotType) {
          retUrl = `/book?gameId=${game.gameId}&slotType=${freeSlotType}`
        } else {
          retUrl = `/game?gameId=${game.gameId}`
        }
        return {
          path: '/profile',
          query: {
            retUrl,
            welcome: true,
          }
        }
      }

      if (freeSlotType) {
        return {
          path: '/book',
          query: { gameId: game.gameId, slotType: freeSlotType }
        }
      }

      if (this.modifyAllowed(slot)) {
        return {
          path: '/reservation',
          query: { gameId: game.gameId, bookId: slot.bookId }
        }
      }
      // do nothing
      return {
        path: '/game',
        query: { gameId: game.gameId }
      }
    }
  },
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.slot {
  width: 100%;
}

.manualPaid {
  background-color: #1c8836 !important;
}

.adminMode {
  border: 1px solid #dc3545;
  color: #dc3545;
}

.loader {
  height: 150px;
}
</style>
<style>
@import '../assets/backarrow.css';
</style>

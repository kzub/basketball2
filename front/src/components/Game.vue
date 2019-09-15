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
      <GameInfo :game="mxGameDetails.game" show="place,time"/>

      <div v-if="mxGameDetails.game.freePlayerSlots == 0"
           class="card-title btn-danger m-1 p-2 mx-2 rounded">
        Свободных мест нет
      </div>

      <div>
        <div class="text-left m-2">Список игроков:</div>
        <div v-for="(slot, index) in mxGameDetails.players" :key="'p'+index">
          <router-link class="d-flex" :to="goLink(mxGameDetails.game, slot)" tag="div">
            <b-button class="my-1 mx-3 slot" :variant="playerColor(slot)">
              <div  v-if="modifyAllowed(slot)">
                <span class="arrow-text">{{ slot.playerName }}</span>
                <div class="arrow"><i class="right"></i></div>
              </div>
              <div v-else>{{ slot.playerName }}</div>
            </b-button>
          </router-link>
        </div>

        <div v-if="mxGameDetails.waiters.length">
          <hr/>
          <div class="text-left m-2">Список запасных:</div>
          <div v-for="(slot, index) in mxGameDetails.waiters" :key="'r'+index">
            <router-link class="d-flex" :to="goLink(mxGameDetails.game, slot)" tag="div">
              <b-button class="my-1 mx-3 slot" :variant="playerColor(slot)">
                <div  v-if="modifyAllowed(slot)">
                  <span class="arrow-text">{{ slot.playerName }}</span>
                  <div class="arrow"><i class="right"></i></div>
                </div>
                <div v-else>{{ slot.playerName }}</div>
              </b-button>
            </router-link>
          </div>
        </div>
      </div>

      <hr/>
      <div class="pl-2 text-left">
        <GameInfo class="" :game="mxGameDetails.game" show="organizer"/>
        <GameInfo class="" :game="mxGameDetails.game" show="payment"/>
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
            Скрыть игру
          </b-button>
          <b-button v-if="showAdminButtons('settle')"
            v-b-modal.ackModal
            @click="changeGameStatus('settled')"
            class="w-100 py-2 my-1" variant="danger">
            Включить запись
          </b-button>
          <b-button
            @click="sendPlayersList"
            class="w-100 py-2 my-1" variant="success">
            Прислать список игроков
          </b-button>
        </div>
      </div>
      <hr/>
      <div class="mt-4 mb-5 mx-3">
        <router-link :to="'/map?gameId=' + mxGameDetails.game.gameId">
          <b-btn class="mt-2" block variant="warning">
            Место проведения
          </b-btn >
        </router-link>
        <b-btn v-if="mxGameDetails.game.chatLink"
               :href="mxGameDetails.game.chatLink"
               class="mt-2" block variant="warning">
          Чат в телеграм
        </b-btn>
      </div>

      <b-modal id="ackModal" title="Подтверждение"
        ok-variant="danger" ok-title="Да" cancel-title="Отмена"
        @ok="actionConfirmed">
        <p class="my-4">Сменить режим?</p>
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
      return this.$store.state.user &&
        this.$store.state.user.userId === this.mxGameDetails.game.organizer.userId
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
    showAdminButtons (button) {
      if (this.mxGameDetails.game.status === 'disabled' &&
        ['settle'].indexOf(button) >= 0) {
        return true
      }
      else if (this.mxGameDetails.game.status === 'settled' &&
        ['disable'].indexOf(button) >= 0) {
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
.game {
  border: 1px solid black;
  margin: 1px;
}
.slot {
  width: 100%;
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

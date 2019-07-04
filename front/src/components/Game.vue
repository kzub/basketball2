<template>
  <div>
    <div v-if="!viewDataUpdated || !mxGameDetails" class="my-2">
      <div class="d-flex justify-content-center flex-wrap-reverse loader">
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

      <div v-if="mxGameDetails.game.freePlayerSlots == 0" class="card-title btn-danger rounded mt-2 mb-3 py-2">
        Свободных мест нет
      </div>

      <div v-if="isAdmin" class="m-1 p-2 rounded adminMode">
        Режим администратора
      </div>

      <div v-if="mxGameDetails.game.status === 'poll'" class="m-1 p-2 rounded manualBookMode">
        Предварительная запись
      </div>

      <div>
        <div class="text-left m-2">Список игроков:</div>
        <div v-for="(slot, index) in mxGameDetails.players" :key="'p'+index">
          <router-link class="d-flex" :to="goLink(mxGameDetails.game, slot)" tag="div">
            <b-button href="#" class="m-1 slot" :variant="playerColor(slot)">
              {{ slot.playerName }}
            </b-button>
            <div v-if="modifyAllowed(slot)" class="arrow">
              <i class="right"></i>
            </div>
          </router-link>
        </div>
        
        <div v-if="mxGameDetails.waiters.length">
          <hr/>
          <div class="text-left m-2">Список запасных:</div>
          <div v-for="(slot, index) in mxGameDetails.waiters" :key="'r'+index">
            <router-link class="d-flex" :to="goLink(mxGameDetails.game, slot)" tag="div">
              <b-button href="#" class="m-1 slot" :variant="playerColor(slot)">
                {{ slot.playerName }}
              </b-button>
              <div v-if="modifyAllowed(slot)" class="arrow">
                <i class="right"></i>
              </div>
            </router-link>
          </div>
        </div>
      </div>

      <hr/>
      <GameInfo :game="mxGameDetails.game" show="organizer,payment"/>
      <hr/>
      <div class="mt-4 mb-5">
        <!-- <div class="text-left m-2">Дополнительная информация:</div> -->

        <!-- <b-collapse :id="'collapsePlace' + game.gameId" class="mt-4"> -->
        <p class="card-text">{{ mxGameDetails.game.place.description }}</p>
        <a :href="'https://www.google.com/maps/search/' + mxGameDetails.game.place.position +'/'">Координаты входа</a>
        <b-btn class="mt-2" block href="tg://join?invite=CE3oJA6vM82vZHQXf03yyA" variant="link">
          Чат площаки
        </b-btn>
        <!-- </b-collapse>   -->
      </div>
    </div>

  </div>
</template>

<script>

import GameUtils from '../mixins/game.js'
import Organizer from './Organizer.vue'
import GameInfo from './GameInfo.vue'

export default {
  name: 'Game',
  mixins: [GameUtils],
  components: {
    Organizer,
    GameInfo,
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
    back: function() {
      this.$router.push({
        path: '/',
      })
    },
    modifyAllowed (slot) {
      if (slot.status.startsWith('free')) {
        return false
      }
      return (this.user && this.user.userId == slot.userId) || this.isAdmin
    },
    goLink (game, slot) {
      if (!this.$store.state.user || !this.$store.state.user.auth) {
        return {
          path: '/profile',
          query: { retUrl: '/game', gameId: game.gameId }
        }
      }
      
      if (slot.status.startsWith('free4')) {
        return {
          path: '/book',
          query: { gameId: game.gameId, slotType: slot.status.slice(5) }
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

.arrow {
  position: absolute;
  margin-left: 85%;
  margin-top: 9px;
}

i {
  border: solid black;
  border-width: 0 3px 3px 0;
  display: inline-block;
  padding: 3px;
}

.right {
  transform: rotate(-45deg);
  -webkit-transform: rotate(-45deg);
}

.adminMode {
  border: 1px solid #dc3545;
  color: #dc3545;
}

.manualBookMode {
  border: 1px solid #557aa2;
  color: #557aa2;
}

.loader {
  height: 150px;
}

</style>

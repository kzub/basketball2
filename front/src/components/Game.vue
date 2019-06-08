<template>
  <div>
    <div v-if="!game || !updated" class="my-2">
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
      <GameInfo :game="game"/>

      <div v-if="!mxAvailableSlots(game.slots)" class="card-title btn-danger rounded mt-2 mb-3 py-2">
        Свободных мест нет
      </div>

      <div v-if="isAdmin" class="m-1 p-2 rounded adminMode">
        Режим администратора
      </div>

      <div v-if="game.payment.type === 'manualBook'" class="m-1 p-2 rounded manualBookMode">
        Предварительная запись
      </div>

      <div>
        <div class="text-left m-2">Список игроков:</div>
        <div v-for="(slot, index) in game.slots" :key="'p'+index">
          <div v-if="!isBackupPlayer(slot)">
            <router-link class="d-flex" :to="goLink(game, slot)" tag="div">
              <b-button href="#" class="m-1 slot" :variant="bgColors[slot.type]">
                {{ slot.text }}
              </b-button>
              <div v-if="modifyAllowed(game, slot)" class="arrow">
                <i class="right"></i>
              </div>
            </router-link>
          </div>
        </div>
        
        <div v-if="backupPlayersExist(game)">
          <hr/>
          
          <div class="text-left m-2">Список запасных:</div>
          <div v-for="(slot, index) in game.slots" :key="'r'+index">
            <div v-if="isBackupPlayer(slot)">
              <router-link class="d-flex" :to="goLink(game, slot)" tag="div">
                <b-button href="#" class="m-1 slot" :variant="bgColors[slot.type]">
                  {{ slot.text }}
                </b-button>
                <div v-if="modifyAllowed(game, slot)" class="arrow">
                  <i class="right"></i>
                </div>
              </router-link>
            </div>
          </div>
        </div>
        
        <hr/>

        <div class="mt-4 mb-5">
          <!-- <div class="text-left m-2">Дополнительная информация:</div> -->

          <!-- <b-collapse :id="'collapsePlace' + game.gameId" class="mt-4"> -->
          <p class="card-text">{{ game.place.description }}</p>
          <a :href="'https://www.google.com/maps/search/' + game.place.position +'/'">Координаты входа</a>
          <b-btn class="mt-2" block href="tg://join?invite=CE3oJA6vM82vZHQXf03yyA" variant="link">
            Чат площаки
          </b-btn>
          <!-- </b-collapse>   -->
        </div>
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
    // console.log('mounter', this.mxLocationInfo.gameId)
    this.$store.dispatch('updateGamesData', this.mxLocationInfo.gameId);
  },
  data: function() {
    return  {
      bgColors: {
        'empty': 'primary',
        'paid': 'success',
        'reserved': 'warning',
        'waitlist': 'secondary',
        'empty-backup': 'secondary',
      },
    }
  },
  computed: {
    isAdmin () {
      return this.$store.state.user && 
        this.$store.state.user.userId === this.game.organizer.userId
    },
    user () {
      return this.$store.state.user
    },
    updated () {
      return this.$store.state.updated
    },
    game () {
      return this.mxGameInfo(this.mxLocationInfo.gameId)
    },
  },
  methods: {
    back: function() {
      this.$router.push({
        path: '/',
      })
    },
    modifyAllowed (game, slot) {
      if (slot.type.indexOf('empty') == 0) {
        return false
      }
      return (this.user && this.user.userId == slot.userId) || this.isAdmin
    },
    isBackupPlayer (slot) {
      return ['waitlist', 'empty-backup'].includes(slot.type)
    },
    backupPlayersExist (game) {
      return game.slots.some(s => this.isBackupPlayer(s))
    },
    goLink (game, slot) {
      if (slot.type.indexOf('empty') == 0) {
        if (this.$store.state.user && this.$store.state.user.auth) {
          return {
            // book slot
            path: '/book',
            query: { gameId: game.gameId, slotType: slot.type }
          }
        }
        return {
          // redirect to auth page
          path: '/profile',
          query: { retUrl: '/book', gameId: game.gameId, slotType: slot.type }
        }
      }

      if (!this.modifyAllowed(game, slot)) {
        return {
          // do nothing
          path: '/game',
          query: { gameId: game.gameId }
        }
      }

      if (this.$store.state.user && this.$store.state.user.auth) {
        return {
          // book slot
          path: '/reservation',
          query: { gameId: game.gameId, rsvId: slot.rsvId }
        }
      }
      return {
        // redirect to auth page
        path: '/profile',
        query: { retUrl: '/reservation', gameId: game.gameId, rsvId: slot.rsvId }
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

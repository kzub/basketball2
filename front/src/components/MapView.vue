<template>
  <div>
    <div v-if="!mxGameDetails" class="my-2">
      <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Загружается...</span>
        </div>
      </div>
    </div>
    <div v-else>
      <b-btn @click="back" class="btn-lg mb-4 rounded-0" block variant="warning">
        <i class="left"></i>
        <span>Назад</span>
      </b-btn>
      <h4 class="my-3 card-text">{{ mxGameDetails.game.place.description }}</h4>
      <GmapMap
          :center="position"
          :zoom="16"
          :options="{
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true,
            disableDefaultUi: true
          }"
          map-type-id="satellite"
          style="width: 100%; height: 400px;"
        >
          <GmapMarker
            :position="position"
            :clickable="false"
            :draggable="true"
          />
      </GmapMap>

      <hr/>
      <p class="my-3 px-2 text-left">{{ mxGameDetails.game.place.howToGet }}</p>
      <hr/>
      <b-btn @click="back" class="mt-2 mb-5 w-50" variant="success">
        OK
      </b-btn>
    </div>
    
  </div>
</template>

<script>

import Vue from 'vue'
import * as VueGoogleMaps from 'vue2-google-maps'

// { lng: 37.384442, lat: 56.070685 }
// {lat: 55.806767, lng: 37.588695}

Vue.use(VueGoogleMaps, {
  load: {
    key: 'AIzaSyCbNJ-awyFChPGPPswsn8__KcbIwgWjcpk',
    libraries: 'places', // This is required if you use the Autocomplete plugin
  },
})

import GameUtils from '../mixins/game.js'

export default {
  name: 'MapView',
  mixins: [GameUtils],
  components: {
  },
  computed: {
    lng: function () {
      return this.mxGameDetails && this.mxGameDetails.game.place.position.lng
    },
    lat: function () {
      return this.mxGameDetails && this.mxGameDetails.game.place.position.lat  
    },
    position: function () {
      return { lng: this.lng, lat: this.lat }
    },
    markers:  function () {
      return [this.position]
    },
    viewDataUpdated () {
      return this.$store.state.viewDataUpdated
    },
  },
  methods: {
    back: function() {
      this.$router.push({
        path: '/game',
        query: { gameId: this.mxGameDetails.game.gameId },
      })
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#map {
  height: 100%;
}
</style>

<style>
@import '../assets/backarrow.css'; 
</style>


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
        <div class="arrow-left"><i class="left"></i></div>
        <span>Назад</span>
      </b-btn>
      <h4 class="my-3 card-text">{{ mxGameDetails.game.place.description }}</h4>
      <GmapMap
          :center="position"
          :zoom="14"
          :options="{
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true,
            disableDefaultUi: false
          }"
          map-type-id="hybrid"
          style="width: 100%; height: 400px;"
        >
          <GmapMarker
            :position="position"
            :clickable="false"
            :draggable="true"
          />
      </GmapMap>

      <hr/>
      <p class="my-3 px-2 howtotext">{{ mxGameDetails.game.place.howToGet }}</p>
      <!-- <hr/>
      <div class="images">
        <img src="https://i.kinja-img.com/gawker-media/image/upload/s--bE3CSBPC--/c_scale,f_auto,fl_progressive,q_80,w_800/l0oxmaf9swngq4ladnoa.jpg"/>
      </div> -->
      <br/><br/><br/>
    </div>
    
  </div>
</template>

<script>

import Vue from 'vue'
import * as VueGoogleMaps from 'vue2-google-maps'

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
  mounted: function() {
    window.scrollTo(0, 0)
  },
  computed: {
    lng: function () {
      return this.mxGameDetails && this.mxGameDetails.game.place.lng
    },
    lat: function () {
      return this.mxGameDetails && this.mxGameDetails.game.place.lat  
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
  width: 100%;
}
.howtotext {
  text-align: justify;
}
.images {
  width: 100%;
}
</style>

<style>
@import '../assets/backarrow.css'; 
</style>


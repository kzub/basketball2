<template>
  <div>
    <div v-if="visible('place')">
      <h3 class="mt-4"> {{ game.place.title }} </h3>

      <b-card-body v-if="visible('time')" class="p-2 m-2">
        <h5>
          {{ mxDateWeekDay(game.date) }}, {{ mxDateDayAndMonth(game.date) }}
        </h5>
        <span class="font-weight-bold btn-lg">
          {{game.timeStart}} - {{game.timeEnd}}
        </span>
      </b-card-body>
    </div>

    <div v-if="visible('organizer')">
      <Organizer :name="game.organizer.name" :phone="game.organizer.phone" />
    </div>
      
    <div v-if="visible('payment')">
      <div v-if="game.paymentType == 'prepay'">
        Стоимость: {{ game.paymentAmount }} р.
      </div>
      <div v-else-if="game.paymentType == 'shared'">
        Стоимость зала: {{ game.paymentAmount }} р. <br>
        Делится на всех участников
      </div>
      <div v-if="game.paymentInfo.message">
        <hr/>
        {{ game.paymentInfo.message }}
      </div>
    </div>

  </div>
</template>

<script>
import DateTime from '../mixins/datetime.js'
import Organizer from './Organizer.vue'

export default {
  name: 'GameInfo',
  mixins: [DateTime],
  props: ['game', 'show'],
  components: {
    Organizer,
  },
  methods: {
    visible: function(place) {
      return this.show.indexOf(place) > -1;
    },
  },
  computed: {
  },
}
</script>

<style scoped>

</style>


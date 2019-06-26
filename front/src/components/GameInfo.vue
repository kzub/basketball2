<template>
  <div class="mx-2">
    <div>
      <h3 v-if="visible('place')" class="mt-4"> {{ game.place.title }} </h3>

      <b-card-body v-if="visible('time')" class="p-2 m-2">
        <h5>
          {{ mxDateWeekDay(game.date) }}, {{ mxDateDayAndMonth(game.date) }}
        </h5>
        <span class="font-weight-bold btn-lg">
          {{game.timeStart}} - {{game.timeEnd}}
        </span>
      </b-card-body>
      
    </div>

    <div no-body class="text-left pl-2">
      <Organizer v-if="visible('organizer')" :name="game.organizer.name" :phone="game.organizer.phone" />

      <div v-if="visible('payment')">
        <div v-if="game.paymentType == 'prepay'">
          Стоимость: {{ game.paymentAmount }} р.
        </div>
        <div v-else-if="game.paymentType == 'shared'">
          Стоимость зала: {{ game.paymentAmount }} р. <br>
          Делится на всех участников
        </div>
        <div v-if="game.props.paymentMessage">
          <hr/>
          {{ game.props.paymentMessage }}
        </div>
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


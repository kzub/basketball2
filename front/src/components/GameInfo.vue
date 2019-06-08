<template>
  <div class="mx-2">
    <div v-if="!short">
      <b-btn class="btn-lg" block href="#" variant="primary">
        {{ game.place.title }}
      </b-btn>
      <b-card-body class="p-2 m-2">
        <h5>
          {{ mxDateWeekDay(game.date) }}, {{ mxDateDayAndMonth(game.date) }}
        </h5>
        <span class="font-weight-bold btn-lg">
          {{game.timeFrom}} - {{game.timeTo}}
        </span>
      </b-card-body>
      <hr/>
    </div>
    <div no-body class="text-left pl-2">
      <Organizer :name="game.organizer.name" :phone="game.organizer.phone" />
      
      <div v-if="game.payment.type == 'prepay'">
        Стоимость: {{ game.payment.amount }} р.
      </div>
      <div v-else>
        Стоимость зала: {{ game.payment.amount }} р. <br>
        Делится на всех участников
      </div>
      <div v-if="game.payment.type === 'manualPay'">
        <hr/>
        <div class="paymentInfo text-dark p-2">
          Итого, с человека: {{ game.payment.amountPerUser }} р.<br>
          {{ game.payment.message }}
        </div>
      </div>
      <hr/>    
    </div>
  </div>
</template>

<script>
import DateTime from '../mixins/datetime.js'
import Organizer from './Organizer.vue'
export default {
  name: 'GameInfo',
  mixins: [DateTime],
  props: ['game', 'short'],
  components: {
    Organizer,
  },
  computed: {
  },
}
</script>

<style scoped>
.paymentInfo {
  border: 10px solid #1de0ff;
}
</style>


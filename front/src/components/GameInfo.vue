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
        Стоимость: {{ game.paymentAmount }} рублей, предоплата.
      </div>
      <div v-else-if="game.paymentType == 'shared'">
        Стоимость зала: {{ game.paymentAmount }} рублей <br>
        <a class="dotted" v-b-modal.payinfo>Делится на всех участников</a>

        <b-modal id="payinfo" cancel-variant="hidden" title="Расчет" class="flex">
          <b-table small borderless striped :items="calculations"></b-table>
        </b-modal>
      </div>
      <div v-if="game.paymentMessage">
        <hr/>
        {{ game.paymentMessage }}
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
      return this.show.indexOf(place) > -1
    },
  },
  computed: {
    calculations: function() {
      let items = [];
      for (let index = 1; index <= this.game.playerSlots; index++) {
        const current = index == this.game.usedPlayerSlots;
        items.push({
          'Игроков': index,
          'Стоимость, ₽': Math.ceil(this.game.paymentAmount / index),
          _rowVariant : current && 'primary',
        })
      }
      return items
    }
  },
}
</script>

<style scoped>
.dotted {
  border: 2px dotted #007bff;
  border-style: none none dotted;
  color: #007bff !important;
  /*background-color: #fff;*/
}

.paymentInfoButton {
  margin: 0px 0px 0px 10px;
  padding: 5px 8px;
}
</style>


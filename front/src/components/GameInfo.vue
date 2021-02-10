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

        <div v-if="visible('openMode') && game.openingMode == 'auto' && game.status === 'disabled'" class="m-2 mt-3">
          <span class="p-2 rounded autoOpenMode">
            откроется {{ mxDateDayAndMonth(game.openingDate) }} в {{ game.openingTime }}
          </span>
        </div>

      </b-card-body>
    </div>

    <div v-if="visible('organizer')">
      <Organizer :name="game.organizer.name" :phone="game.organizer.phone" />
    </div>

    <div v-if="visible('payment')">
      <div v-if="game.paymentType == 'prepay'">
        <div>Предоплата</div>
        <div>Стоимость: {{ game.paymentAmount }} р. </div>
        <div v-if="game.hoursBeforeGameRefundAllowed">Бесплатная отмена: за {{game.hoursBeforeGameRefundAllowed}} ч.</div>
        <div><a class="dotted" v-b-modal.payReturnInfoGI>Полные условия возврата</a></div>
        <b-modal id="payReturnInfoGI" cancel-variant="hidden" title="Условия возврата" class="flex">
          <RefundRules :game="game" />
        </b-modal>
      </div>
      <div v-else-if="game.paymentType == 'shared'">
        <div>Оплата после игры</div>
        <div>Стоимость зала: {{ game.paymentAmount }} р.</div>
        <div><a class="dotted" v-b-modal.payinfo>Делится на всех пришедших</a> </div>

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
import RefundRules from './RefundRules.vue'

export default {
  name: 'GameInfo',
  mixins: [DateTime],
  props: ['game', 'show'],
  components: {
    Organizer,
    RefundRules,
  },
  data: function() {
    return {
      prepayRefundText: ``,
    }
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
          'Стоимость, р.': Math.ceil(this.game.paymentAmount / index),
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
}

.autoOpenMode {
  border: 1px solid #007bff;
  color: #007bff;
}

.paymentInfoButton {
  margin: 0px 0px 0px 10px;
  padding: 5px 8px;
}
</style>

<style>
@import '../assets/backarrow.css';
</style>


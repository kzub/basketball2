<template>
  <div>
    <div v-if="!viewDataUpdated" class="my-2">
      <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Загружается...</span>
        </div>
      </div>
    </div>

    <div v-else>
      <h3 class="btn-warning py-3">
        Перевод
      </h3>
      <div v-if="!freePayment || !freePayment.ok">
        <h5 class="mt-5">
          Получатель не найден
        </h5>
        <h5 class="mt-3">
          (некорректная ссылка оплаты)
        </h5>
      </div>
      <div v-else>
        <b-card-body class="p-2 m-2">
          <h5 class="mt-4">
            Получатель:
          </h5>
          <div class=" btn-lg my-2">
            {{freePayment.name}}
          </div>

          <b-form class="text-left my-4">
            <b-form-input id="userName"
                          type="number"
                          v-model="form.amount"
                          placeholder="Сумма перевода">
            </b-form-input>
          </b-form>
          <PayButton
            :account="freePayment.paymentGateAccount"
            :message="freePayment.paymentGateMessage"
            :amount="form.amount"
            :label="paymentId"
          />
        </b-card-body>
      </div>
    </div>
  </div>
</template>

<script>

import PayButton from './PayButton.vue'

export default {
  name: 'FreePayment',
  components: {
    PayButton,
  },
  mounted: function () {
    this.$store.dispatch(
      'updateFreePaymentInfo', {
        organizerId: this.$router.currentRoute.query.o,
        account: this.$router.currentRoute.query.a,
      }
    );
  },
  data: function () {
    return {
      form: {
        amount: undefined,
      }
    }
  },
  computed: {
    paymentId: function () {
      return ['FP', this.user && this.user.userId].join('|')
    },
    freePayment: function () {
      return this.$store.state.freePayment
    },
    user () {
      return this.$store.state.user
    },
    viewDataUpdated () {
      return this.$store.state.viewDataUpdated
    },
  },
  methods: {
    back: function() {
      this.$router.push({
        path: '/',
      })
    },
  },
}
</script>

<style scoped>

</style>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
@import '../assets/backarrow.css';
</style>

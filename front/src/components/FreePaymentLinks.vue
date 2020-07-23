<template>
  <div>
    <b-btn @click="back" class="btn-lg mb-3 rounded-0" block variant="warning">
      <div class="arrow-left"><i class="left"></i></div>
      <span>Назад</span>
    </b-btn>

    <div v-if="!viewDataUpdated || !freePaymentList || !freePaymentList.YMs || !user" class="my-2">
      <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Загружается...</span>
        </div>
      </div>
    </div>
    <div v-else>
      <h3 class="py-3">
        Ссылка на оплату
      </h3>
      <p>
        Если нужно перевести денег на ваш Яндекс кошелек, передайте эту ссылку отправителю
      </p>

      <div v-for="fp in freePaymentList.YMs" :key="fp.paymentGateAccount">
        <h5 class="btn-secondary py-3"> Перевод на {{fp.paymentGateAccount}} </h5>
        Ссылка:
        <a :href="link(fp)">
          <h6 class="p-2 text-left">
            {{link(fp)}}
          </h6>
        </a>
        <hr/>
      </div>

    </div>
  </div>
</template>

<script>

export default {
  name: 'FreePaymentLinks',
  components: {
  },
  mounted: function () {
    this.$store.dispatch('updateFreePaymentLinks');
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
    freePaymentList: function () {
      return this.$store.state.freePaymentList
    },
    user () {
      return this.$store.state.user
    },
    viewDataUpdated () {
      return this.$store.state.viewDataUpdated
    },
  },
  methods: {
    back: function () {
      this.$router.push({
        path: '/',
      })
    },
    link: function (fp) {
      const { protocol, host } = document.location
      return `${protocol}//${host}/#fp?o=${this.user.userId}&a=${fp.paymentGateAccount}`
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

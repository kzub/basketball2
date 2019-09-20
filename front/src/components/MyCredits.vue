<template>
  <div>
    <b-btn v-if="!refundAmount" @click="back" class="btn-lg mb-3 rounded-0" block variant="warning">
      <div class="arrow-left"><i class="left"></i></div>
      <span>Назад</span>
    </b-btn>

    <div v-if="!viewDataUpdated" class="my-4 p-4">
      <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Загружается...</span>
        </div>
      </div>
    </div>

    <div v-else>
      <div v-if="refundAmount">
        <b-btn class="w-100 btn-lg mb-3" variant="warning">
          Начисление
        </b-btn>
        <div>
          <b-btn class="my-4 w-75" variant="danger">Вам начислено {{refundAmount}} ₽</b-btn>
        </div>
        <div class="mt-2">
          <b-btn class="w-25" @click="ok">OK</b-btn>
        </div>
      </div>
      <div v-else>
        <b-card-body class="p-2 m-2">
          <h3>Мои предоплаты</h3>
          <p class="mt-4">Вы можете использовать средства со счета для оплаты участия в будущих играх организатора</p>
        </b-card-body>


        <b-table small borderless striped
          :fields="creditsFields"
          :items="creditsList">
        </b-table>
      </div>
    </div>

  </div>
</template>

<script>

export default {
  name: 'MyCredits',
  components: {
  },
  mounted: function() {
    if (this.$router.currentRoute.query.refundAmount) {
      this.refundAmount = this.$router.currentRoute.query.refundAmount
    }
  },
  data: function () {
    return {
      refundAmount: 0,
    }
  },
  computed: {
    viewDataUpdated () {
      return this.$store.state.viewDataUpdated
    },
    user () {
      return this.$store.state.user
    },
    creditsFields: function () {
      return [
        { key: 'name', label: 'Организатор' },
        { key: 'total', label: 'Баланс, ₽' },
      ]
    },
    creditsList: function() {
      if (!this.user) {
        return []
      }
      return this.$store.state.user.credits
    },
  },
  methods: {
    ok: function () {
      this.refundAmount = 0
    },
    back: function() {
      if (this.refundAmount) {
        this.refundAmount = 0
        return
      }
      this.$router.push({
        path: '/',
      })
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

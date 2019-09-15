<template>
  <div>
    <b-btn @click="back" class="btn-lg mb-3 rounded-0" block variant="warning">
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
      <b-card-body class="p-2 m-2">
        <h3>Возвраты и предоплата</h3>
        Список неиспользованных средств
      </b-card-body>
      
      <div v-if="creditorsCount">
        <b-table small borderless striped 
          :fields="creditorsFields"
          :items="creditorsList">
          
          <template v-slot:cell(actions)="data">
            <b-badge class="m-1 px-3 py-2">-</b-badge>
            <b-badge class="m-1 px-3 py-2">+</b-badge>
            
          </template>
        </b-table>
      </div>
      <div v-else>
        <b-card no-body class="my-4 mx-4">
          <b-btn class="noGames" block variant="secondary">
            Начислений для вашего акканута нет
          </b-btn>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'Credits',
  components: {
  },
  mounted: function(){
    this.$store.dispatch('getCreditors')
  },
  computed: {
    viewDataUpdated () {
      return this.$store.state.viewDataUpdated
    },
    creditorsCount: function() {
      return this.$store.state.creditors && this.$store.state.creditors.creditorsList.length
    },
    creditorsFields: function () {
      return [
        { key: 'name', label: 'Игрок' },
        { key: 'amount', label: 'Баланс, ₽' },
        // { key: 'actions', label: 'Действия' },
      ]
    },
    creditorsList: function() {
      if (!this.$store.state.creditors) {
        return []
      }
      return this.$store.state.creditors.creditorsList
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

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

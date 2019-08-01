<template>
  <div class="hello">
    <div v-if="!viewDataUpdated" class="my-2">
      <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Загружается...</span>
        </div>
      </div>
    </div>

    <div v-else>
      <b-btn @click="back" class="btn-lg mb-3 rounded-0" block variant="warning">
        <div class="arrow-left"><i class="left"></i></div>
        <span>Назад</span>
      </b-btn>
    </div>

    В разработке.....
    <form>
      <div v-for="opt in newGameOptions" :key="opt.label">
        <div v-if="opt.type==='number'">
          {{opt.output}}
          <label>{{opt.label}}</label><input v-model.number="opts[opt.output]" type="number"/>
          
        </div>
      </div>
    </form>
    
    <b-btn @click="click">click</b-btn>
  </div>
</template>

<script>
export default {
  name: 'GameNew',
  props: {
  },
  mounted: function(){
    const self = this;
    this.$store.dispatch('updateNewGameOptions')
  },
  computed: {
    user () {
      return this.$store.state.user
    },
    viewDataUpdated () {
      return this.$store.state.viewDataUpdated
    },
    newGameOptions () {
      return this.$store.state.newGameOptions
    },
    opts () {
      return this.$store.state.newGameOptions.reduce((acc, item) => {
        acc[item.output] = undefined
        item.options && item.options.map(i => 
          i.inputs && i.inputs.map(ii => acc[ii.output] = undefined))
        return acc
      }, {})
    },
  },
  methods: {
    back: function () {
      this.$router.back()
    },
    click: function () {
      console.log('HAHA', this.opts);
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>

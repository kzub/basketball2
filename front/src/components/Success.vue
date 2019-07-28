<template>
  <div>
      <b-btn class="w-100 btn-lg mb-3 rounded-0" variant="primary">
        Информация
      </b-btn>
    <div class="d-flex flex-column px-2 m-3">
      <hr/>
      Перевод совершен успешно!
      <hr/>
      <b-btn href="/#/" class="mt-1" variant="success">
        OK
      </b-btn>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Success',
  props: [],
  components: {
  },
  computed: {
  },
  methods: {
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

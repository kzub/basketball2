<template>
  <div>
    <b-btn @click="back" class="btn-lg mb-3 rounded-0" block variant="warning">
      <div class="arrow-left"><i class="left"></i></div>
      <span>Назад</span>
    </b-btn>

    <div v-if="!viewDataUpdated || !user" class="my-2">
      <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Загружается...</span>
        </div>
      </div>
    </div>
    <div v-else>
      <h3 class="py-3">
        Ссылка на вход
      </h3>

      <b-card-body>
        <b-form @submit="getLoginLink">
          <b-form-group id="phoneNumber"
                        label-for="userPhone"
                        class="description"
                        description="">
            <div class="d-flex flex-row">
              <b-form-input id="userPhone"
                          type="text"
                          v-model="form.phone"
                          required
                          placeholder="Введите телефон">
              </b-form-input>
            </div>
          </b-form-group>
          <b-btn class="w-75 mt-3" type="submit" variant="primary">Сгенерировать</b-btn>
        </b-form>
      </b-card-body>

      <h3 class="py-3" v-if="link">
        <a :href="link">войти</a>
      </h3>

    </div>
  </div>
</template>

<script>

export default {
  name: 'LoginLink',
  components: {
  },
  data: function () {
    return {
      form: {
        phone: '',
      },
      link: '',
    }
  },
  computed: {
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
    getLoginLink (evt) {
      evt.preventDefault()
      this.$store.dispatch('getLoginLink', this.form.phone)
      .then(res => {
        this.link = res && res.link || 'link loading error'
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

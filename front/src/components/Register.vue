<template>
  <div>
    <div role="tablist">

      <b-card no-body class="mb-1">
        <b-btn class="p-2 rounded-0" block href="#" v-b-toggle.regStep1 variant="secondary">
          Личные данные
        </b-btn>

        <b-collapse id="regStep1" visible accordion="reg-accordion" role="tabpanel">
          <b-card-body>
            <b-form @submit="onSubmitCode">
              <b-form-group id="userName"
                            label-for="userName"
                            description="Необходимо для прохода на площадку">
                <b-form-input id="userName"
                              type="text"
                              v-model="form.name"
                              required
                              placeholder="Фамилия и имя">
                </b-form-input>
              </b-form-group>              
              <b-form-group id="phoneNumber"
                            label-for="userPhone"
                            description="Для связи, в случае каких-либо изменений">
                <b-form-input id="userPhone"
                              type="number"
                              v-model="form.phone"
                              required
                              placeholder="Введите телефон">
                </b-form-input>
              </b-form-group>
              <b-btn type="submit" variant="primary">Отправить код</b-btn>
            </b-form>
          </b-card-body>
        </b-collapse>
      </b-card>

      <b-card no-body class="mb-1">
        <b-btn class="p-2 rounded-0" block href="#" disabled v-b-toggle.regStep2 variant="secondary">Подтверждение</b-btn>

        <b-collapse id="regStep2" accordion="reg-accordion" role="tabpanel">
          <b-card-body>
            <b-form @submit="onSubmitSave">
              <b-form-group id="confirmationCode"
                            label="Код подтверждения"
                            label-for="confirmationCode"
                            description="Код отправлен в смс на ваш номер">
                <b-form-input id="confirmationCode"
                              type="number"
                              v-model="form.code"
                              required
                              placeholder="">
                </b-form-input>
              </b-form-group>              

              <b-btn type="submit" variant="primary">Сохранить изменения</b-btn>
            </b-form>
          </b-card-body>
        </b-collapse>
      </b-card>
    </div>

  </div>
</template>

<script>

  import GameUtils from '../mixins/game.js'

  export default {
    name: 'Register',
    mixins: [GameUtils],
    props: ['name', 'phone'],
    data () {
      return {
        form: {
          phone: this.phone,
          name: this.name,
          code: '',
        },
      }
    },
    components: {
    },
    computed: {
    },
    methods: {
      onSubmitCode (evt) {
        evt.preventDefault()
        this.$root.$emit('bv::toggle::collapse', 'regStep2')
      },
      onSubmitSave (evt) {
        evt.preventDefault()
        // alert(JSON.stringify(this.form))
        if (this.mxLocationInfo.retUrl) {
          this.$router.push({
            path: this.mxLocationInfo.retUrl,
            query: {
              gameId: this.mxLocationInfo.gameId,
              retUrl: '/',
            },
          })
        } else {
          this.back()
        }
      },
      back: function() {
        this.$router.back()
      }
    },
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}

</style>

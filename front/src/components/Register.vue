<template>
  <div>
    <div role="tablist">

      <b-card no-body class="mb-1">
        <b-btn class="p-2 rounded-0" block href="#" v-b-toggle.regStep1 variant="secondary">
          Номер телефона
        </b-btn>

        <b-collapse id="regStep1" visible accordion="reg-accordion" role="tabpanel">
          <div v-if="sendingSMS" class="my-2">
            <div class="d-flex justify-content-center">
              <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
              </div>
            </div>
          </div>
          <b-card-body v-else>
            <b-form @submit="sendCheckCode">
              <b-form-group id="phoneNumber"
                            label-for="userPhone"
                            class="description"
                            description="Для связи, в случае каких-либо изменений">
                <div class="d-flex flex-row">
                  <b-form-input id="userPhone"
                              type="number"
                              v-model="form.phone"
                              required
                              placeholder="Введите телефон">
                  </b-form-input>
                </div>
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
            <b-form @submit="authUser">
              <b-form-group id="confirmationCode"
                            label="Код подтверждения"
                            label-for="confirmationCode"
                            description="Код отправлен в смс на ваш номер">
                <b-form-input id="confirmationCode"
                              ref="focusThis"
                              type="number"
                              v-model="form.code"
                              required
                              placeholder="">
                </b-form-input>
              </b-form-group>

              <b-btn type="submit" variant="primary">Отправить</b-btn>
            </b-form>
          </b-card-body>
        </b-collapse>
      </b-card>
    </div>

    <div>
      <b-modal id="err-check-phone" title="Ошибка" ok-variant="danger" ok-title="ОК" cancel-variant="hidden">
        <h5 class="my-4 text">Не удалось отправить смс, превышено разрешенное число попыток, неверный номер телефона или проблемы с интернетом</h5>
      </b-modal>
    </div>

    <div>
      <b-modal id="err-check-code" @ok="onCodeError" title="Ошибка" ok-variant="danger" ok-title="ОК" cancel-variant="hidden">
        <h5 class="my-4 text">Не правильный код или время жизни кода истекло, попробуйте сначала</h5>
      </b-modal>
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
        sendingSMS: false,
      }
    },
    components: {
    },
    computed: {
    },
    methods: {
      sendCheckCode (evt) {
        evt.preventDefault()
        this.sendingSMS = true
        this.$store.dispatch('sendCheckCode', this.form.phone)
        .then(res => {
          if (res && res.ok) {
            this.$root.$emit('bv::toggle::collapse', 'regStep2')
            setTimeout(() => { this.sendingSMS = false }, 1000)
          }
          else {
            this.$bvModal.show('err-check-phone')
            this.sendingSMS = false
          }
        })
      },
      authUser: function (evt) {
        evt.preventDefault()
        this.$store.dispatch('authUser', {
          phone: this.form.phone,
          code: this.form.code,
        })
        .then(user => {
          if (!user || !user.auth) {
            this.$bvModal.show('err-check-code')
            this.form.code = ''
            return
          }
          this.$store.commit('user', user)
        })
      },
      onCodeError: function () {
        this.$root.$emit('bv::toggle::collapse', 'regStep1')
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

.description {
  text-align: left;
};

</style>

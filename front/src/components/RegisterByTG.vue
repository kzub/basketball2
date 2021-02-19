<template>
  <div>
    <div v-if="processing" class="my-4">
      <b-card-body class="m-2">
        Следуйте инструкциям в чате с ботом
      </b-card-body>
      <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Loading...</span>
        </div>
      </div>
    </div>
    <b-card-body v-else>
      <b-card-body class="m-2">
        <div class="">Для регистрации необходим <b>Telegram</b></div>
        <div class="mt-2">Отправьте боту команду <b>/start</b></div>
      </b-card-body>

      <b-card-body class="m-2 warningText">
        <b-btn class="w-75" variant="primary" @click="onGoTelegram" :href="getLinkWithCode()">
          Перейти в чат с ботом
        </b-btn>
      </b-card-body>
    </b-card-body>
  </div>
</template>

<script>
  export default {
    name: 'RegisterByTG',
    data () {
      return {
        processing: false,
      }
    },
    destroyed () {
      this.processing = false
    },
    methods: {
      async onGoTelegram () {
        this.processing = true
        const maxTries = 120;
        for (let i = 0; i < maxTries; i++) {
          if (!this.processing) {
            return
          }

          let res = await this.$store.dispatch('getUserInfo', true /*skipFlagUpdate*/)
          if (res && res.auth) {
            this.processing = false
            if (res.user && res.user.name) {
              if (this.$router.currentRoute.query.retUrl) {
                this.$router.push(this.$router.currentRoute.query.retUrl)
                return
              }
              this.back()
            }
            return
          }
          await this.sleep(1000 + (3000*i/maxTries))
        }
        this.processing = false
      },
      async sleep (ms) {
        // console.log('sleep', ms)
        return new Promise(f => setTimeout(f, ms))
      },
      getLinkWithCode () {
        this.$store.commit('createAuthCode')
        return `tg://resolve?domain=${this.$store.state.user.botName}&start=${this.$store.state.authCode}`
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

.mainText {
  font-size: 22px;
}

</style>

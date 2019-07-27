<template>
  <div>
    <b-btn @click="back" class="btn-lg mb-4 rounded-0" block variant="warning">
      <div v-if="!newUser" class="arrow-left"><i class="left"></i></div>
      <span v-if="!newUser">Назад</span> &nbsp;
    </b-btn>
    <div v-if="!user || !user.auth" class="my-2">
      <div v-if="wentFromGame" class="mb-4">
        <b-card-body class="m-2 size-4 warningText">
          Для продолжения бронирования необходимо зарегистрироваться
        </b-card-body>
      </div>
      <Register/>
    </div>
    <div v-else-if="wantChange || newUser" class="my-2">
      <b-btn class="p-2 rounded-0" block href="#" variant="secondary">
          Фамилия и имя
        </b-btn>
      <b-form @submit="changeName" class="mt-3 d-flex flex-column" >
        <b-form-group id="userName"
                      label-for="userName"
                      class="description mx-4 my-2"
                      description="Необходимо для прохода на площадку">
          <b-form-input id="userName"
                        type="text"
                        class="userName"
                        v-model="newName"
                        required
                        placeholder="Фамилия и имя">
          </b-form-input>
        </b-form-group>
        <b-btn class="mx-4 my-2" type="submit" variant="primary">Сохранить</b-btn>
      </b-form>
    </div>
    <div v-else>
      <b-card no-body class="mb-1">
        <b-btn class="p-2 rounded-0" block href="#" v-b-toggle.regStep2 variant="secondary">
          Личные данные
        </b-btn>
        <b-card-body>
          <h5>{{ user.name }}</h5>
          <h5>{{ user.phone }}</h5>
        </b-card-body>
      </b-card>

      <div class="mt-3 d-flex flex-column">
        <b-btn class="mx-4 my-2" @click="changeProfile" variant="primary">Изменить</b-btn>
        <b-btn class="mx-4 my-2" @click="exit" variant="danger">Выйти</b-btn>
      </div>
    </div>

    <div>
      <b-modal id="err-change" title="Ошибка" ok-variant="danger" ok-title="ОК" cancel-variant="hidden">
        <h5 class="my-4 text">Не удалось сохранить изменения. Проверьте доступность интернета</h5>
      </b-modal>
    </div>
  </div>
</template>

<script>

import Register from './Register.vue'

export default {
  name: 'Profile',
  components: {
    Register,
  },
  data: function() {
    return  {
      wantChange: false,
      newName: '',
    }
  },
  computed: {
    user () {
      return this.$store.state.user
    },
    wentFromGame: function () {
      return this.$router.currentRoute.query.welcome
    },
    newUser: function () {
      return this.$store.state.user && this.$store.state.user.name === ''
    }
  },
  methods: {
    changeProfile: function () {
      this.newName = this.user && this.user.name
      this.wantChange = true
    },
    changeName: function (evt) {
      evt.preventDefault()
      
      this.$store.dispatch('setUserName', this.newName)
      .then(res => {
        if (!res || !res.ok) {
          this.$bvModal.show('err-change')
        } else {
          this.wantChange = false
        }
      })
    },
    exit: function () {
      this.$store.dispatch('exitUser')
      this.back()
    },
    back: function() {
      if (this.newUser) {
        return
      }
      if (this.wantChange) {
        this.wantChange = false;
        return
      }
      this.$router.back()
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.userName {
  font-size: 20px;
}

.warningText {
  font-size: 20px;
}
</style>

<style>
@import '../assets/backarrow.css'; 
</style>

@import '../assets/backarrow.css'; 
</style>

<template>
  <div>

    <b-form method="POST" action="https://money.yandex.ru/quickpay/confirm.xml">
      <input name="receiver" type="hidden" :value="account">
      <input name="quickpay-form" type="hidden" value="donate">
      <input id="ordertarget" type="hidden" name="targets" :value="message">
      <input name="paymentType" type="hidden" value="AC">
      <input name="sum" type="hidden" :value="amount" data-type="number">
      <input name="label" type="hidden" :value="label">
      <input name="successURL" type="hidden" :value="successURL">

      <b-btn @click="onClick" type="submit" class="my-1 w-100" variant="success">
        {{buttonText}} <div class="arrow"><i class="right"></i></div>
      </b-btn>
    </b-form>

  </div>
</template>

<script>
export default {
  name: 'PayButton',
  props: ['account','message','amount','label','buttonText','retQueryParams','onSubmit'],
  computed: {
    successURL: function () {
      return document.location.host + `/#/success?${this.retQueryParams || ''}`
    },
  },
  methods: {
    onClick (evt) {
      if (this.onSubmit) {
        evt.preventDefault()
        this.onSubmit(() => {
          evt.target.parentElement.submit()
        })
      }
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

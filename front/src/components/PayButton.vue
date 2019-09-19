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

      <b-btn type="submit" class="my-1 w-100" variant="success">
        {{buttonText}}
      </b-btn>
    </b-form>

  </div>
</template>

<script>
export default {
  name: 'PayButton',
  props: ['account','message','amount','label','buttonText', 'retQueryParams'],
  computed: {
    successURL: function () {
      return document.location.host + `/#/success?${this.retQueryParams||''}`
    },
  },
  methods: {
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>

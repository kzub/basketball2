<template>
  <div>
    При отмене ранее чем за {{game.hoursBeforeGameRefundAllowed}} ч. до начала игры, вся уплаченная сумма начисляется на ваш счет в системе, который можно использовать для оплаты других игр только текущего организатора.<br>
    <br>
    При отмене позднее чем за {{game.hoursBeforeGameRefundAllowed}} ч. до начала игры, уплаченные средства компенсируются если находится замена, в ином случае не компенсируются.
  </div>
</template>

<script>
export default {
  name: 'RefundRules',
  props: ['game'],
}
</script>

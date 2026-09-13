<template>
  <div>
    <OrderFormMaintenance
      :pk="pk"
      :unaccepted="unaccepted"
      :maintenance="maintenance"
      :from_quotation="from_quotation"
      :quotation_id="quotation_id"
    />
  </div>
</template>

<script>
import OrderFormMaintenance from "./OrderFormMaintenance.vue"

export default {
  name: "OrderForm",
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
    unaccepted: {
      type: [Boolean],
      default: false
    },
    maintenance: {
      type: [Boolean],
      default: false
    },
    from_quotation: {
      type: [Boolean],
      default: false
    },
    quotation_id: {
      type: [String, Number],
      default: null
    },
  },
  components: {
    OrderFormMaintenance,
  },
}
</script>

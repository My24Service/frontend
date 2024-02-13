<template>
  <div>
    <OrderFormMaintenance
      v-if="memberType === 'maintenance'"
      :pk="pk"
      :unaccepted="unaccepted"
      :maintenance="maintenance"
      :from_quotation="from_quotation"
      :quotation_id="quotation_id"
    />
    <OrderFormTemps
      v-if="memberType === 'temps'"
      :unaccepted="unaccepted"
      :pk="pk"
    />
  </div>
</template>

<script>
import OrderFormMaintenance from "./OrderFormMaintenance.vue"
import OrderFormTemps from "./OrderFormTemps.vue"

export default {
  name: "OrderForm",
  data() {
    return {
      memberType: null,
    }
  },
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
    OrderFormTemps,
  },
  async created() {
    this.memberType = await this.$store.dispatch('getMemberType')
  },
}
</script>

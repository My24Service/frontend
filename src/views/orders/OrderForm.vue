<template>
  <div>
    <OrderFormMaintenance v-if="memberType === 'maintenance'" v-bind:pk="pk" />
    <OrderFormTemps v-if="memberType === 'temps'" v-bind:pk="pk" />
  </div>
</template>

<script>
import OrderFormMaintenance from "./OrderFormMaintenance"
import OrderFormTemps from "./OrderFormTemps"

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
  },
  components: {
    OrderFormMaintenance,
    OrderFormTemps,
  },
  created() {
    // get member type
    this.$store.dispatch('getMemberType')
      .then((memberType) => {
        this.memberType = memberType
      })
  },
}
</script>

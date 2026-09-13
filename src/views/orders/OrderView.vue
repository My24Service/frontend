<template>
  <div>
    <OrderViewMaintenance
      v-bind:pk="pk"
      v-bind:uuid="uuid"
      v-bind:past="past"
    />
  </div>
</template>

<script>
import OrderViewMaintenance from "./OrderViewMaintenance.vue"

export default {
  name: "OrderView",
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
    uuid: {
      type: [String],
      default: null
    },
    past: {
      type: [Boolean],
      default: false
    },
  },
  components: {
    OrderViewMaintenance,
  },
}
</script>

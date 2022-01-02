<template>
  <div v-if="isLoaded">
    <OrderViewMaintenance
      v-if="memberType === 'maintenance'"
      v-bind:pk="pk"
      v-bind:past="past"
    />
    <OrderViewTemps
      v-if="memberType === 'temps'"
      v-bind:pk="pk"
      v-bind:past="past"
    />
  </div>
</template>

<script>
import OrderViewMaintenance from "./OrderViewMaintenance";
import OrderViewTemps from "./OrderViewTemps";

export default {
  name: "OrderView",
  data() {
    return {
      isLoaded: false,
      memberType: null,
    }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
    past: {
      type: [Boolean],
      default: false
    },
  },
  components: {
    OrderViewMaintenance,
    OrderViewTemps,
  },
  created() {
    // get member type
    this.$store.dispatch('getMemberType')
      .then((memberType) => {
        this.memberType = memberType
        this.isLoaded = true
      })
  },
}
</script>

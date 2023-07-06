<template>
  <div v-if="isLoaded">
    <OrderViewMaintenance
      v-if="memberType === 'maintenance'"
      v-bind:pk="pk"
      v-bind:uuid="uuid"
      v-bind:past="past"
    />
    <OrderViewTemps
      v-if="memberType === 'temps'"
      v-bind:uuid="uuid"
      v-bind:pk="pk"
      v-bind:past="past"
    />
  </div>
</template>

<script>
import OrderViewMaintenance from "./OrderViewMaintenance.vue"
import OrderViewTemps from "./OrderViewTemps.vue"

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
    OrderViewTemps,
  },
  async created() {
    // get member type
    this.memberType = await this.$store.dispatch('getMemberType')
    this.isLoaded = true
  },
}
</script>

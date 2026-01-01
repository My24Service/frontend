<template>
  <BFormSelect
    v-if="this.orderTypes.length > 0"
    :input="$emit('update:orderType', orderType)"
    v-model="orderType"
    :options="orderTypes"
  ></BFormSelect>
</template>

<script>
export default {
  props: {
    includeAll: {
      type: [Boolean],
      default: false
    },
    orderTypeIn: {
      type: [String],
      default: null
    },
  },
  data() {
    return {
      orderType: null,
      orderTypes: []
    }
  },
  mounted() {
    this.$store.dispatch('getOrderTypes')
      .then((order_types) => {
        this.orderTypes = this.includeAll ? ['all', ...order_types] : order_types
        this.orderType = this.orderTypeIn !== null ? this.orderTypeIn : this.orderTypes[0]
      })
  }
}
</script>

<style scoped>
</style>

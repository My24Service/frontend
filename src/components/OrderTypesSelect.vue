<template>
  <BFormSelect
    v-if="this.orderTypes.length > 0"
    :input="$emit('update:orderType', orderType)"
    v-model="orderType"
    :options="orderTypes"
  ></BFormSelect>
</template>

<script>
import {useMainStore} from "@/stores/main";

export default {
  setup() {
    const mainStore = useMainStore()

    return {
      mainStore
    }
  },
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
    const order_types = this.mainStore.getOrderTypes
    this.orderTypes = this.includeAll ? ['all', ...order_types] : order_types
    this.orderType = this.orderTypeIn !== null ? this.orderTypeIn : this.orderTypes[0]
  }
}
</script>

<style scoped>
</style>

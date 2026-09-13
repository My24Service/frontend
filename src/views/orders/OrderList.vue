<template>
  <div>
    <OrderListMaintenance
      :dispatch="dispatch"
      :query-mode="queryMode"
      :key="$route.fullPath"
    />
  </div>
</template>

<script>
import OrderListMaintenance from "./OrderListMaintenance.vue"

export default {
  props: {
    dispatch: {
      type: [Boolean],
      default: false
    },
    queryMode: {
      type: [String],
      default: 'all'
    },
  },
  components: {
    OrderListMaintenance,
  },
}
</script>

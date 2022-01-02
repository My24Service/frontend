<template>
  <div>
    <OrderListMaintenance
      v-if="memberType === 'maintenance'"
      :dispatch="dispatch"
      :query-mode="queryMode"
    />
    <OrderListTemps
      v-if="memberType === 'temps'"
      :dispatch="dispatch"
      :query-mode="queryMode"
    />
  </div>
</template>

<script>
import OrderListMaintenance from "./OrderListMaintenance";
import OrderListTemps from "./OrderListTemps";

export default {
  props: {
    dispatch: {
      type: [Boolean],
      default: false
    },
    queryMode: {
      type: [String],
      default: 'all'
    }
  },
  data() {
    return {
      memberType: null,
    }
  },
  components: {
    OrderListMaintenance,
    OrderListTemps,
  },
  created() {
    // get member type
    this.$store.dispatch('getMemberType').then((memberType) => {
      this.memberType = memberType
    })
  },
}
</script>

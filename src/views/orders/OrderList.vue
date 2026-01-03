<template>
  <div>
    <OrderListMaintenance
      v-if="memberType === 'maintenance'"
      :dispatch="dispatch"
      :query-mode="queryMode"
      :key="$route.fullPath"
    />
    <OrderListTemps
      v-if="memberType === 'temps'"
      :dispatch="dispatch"
      :query-mode="queryMode"
      :key="$route.fullPath"
    />
  </div>
</template>

<script>
import OrderListMaintenance from "./OrderListMaintenance.vue"
import OrderListTemps from "./OrderListTemps.vue"
import {useMainStore} from "@/stores/main";

export default {
  setup() {
    const mainStore = useMainStore()

    // expose to template and other options API hooks
    return {
      mainStore
    }
  },
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
  data() {
    return {
      memberType: null,
    }
  },
  components: {
    OrderListMaintenance,
    OrderListTemps,
  },
  async created() {
    this.memberType = await this.mainStore.getMemberType()
  },
}
</script>

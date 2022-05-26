<template>
  <div>
    <OrderFormMaintenancePlanning
      v-if="!isCustomer || isStaff || isSuperuser"
      :pk="pk"
      :unaccepted="unaccepted"
      :maintenance="maintenance"
    />
    <OrderFormMaintenanceCustomer
      v-if="isCustomer && !isStaff && !isSuperuser"
      :pk="pk"
    />
  </div>
</template>

<script>
import OrderFormMaintenancePlanning from "./OrderFormMaintenancePlanning.vue"
import OrderFormMaintenanceCustomer from "./OrderFormMaintenanceCustomer.vue"
import { componentMixin } from '@/utils.js'

export default {
  name: "OrderFormMaintenance",
  mixins: [componentMixin],
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
  },
  components: {
    OrderFormMaintenancePlanning,
    OrderFormMaintenanceCustomer,
  },
}
</script>

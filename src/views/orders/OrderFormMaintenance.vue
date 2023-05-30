<template>
  <div>
    <OrderFormMaintenancePlanning
      v-if="isPlanning || isStaff || isSuperuser"
      :pk="pk"
      :unaccepted="unaccepted"
      :maintenance="maintenance"
    />
    <OrderFormMaintenanceCustomer
      v-if="isCustomer && !hasBranches && !isBranchEmployee && !isStaff && !isSuperuser"
      :pk="pk"
    />
    <OrderFormMaintenanceEmployee
      v-if="isBranchEmployee && !isStaff && !isSuperuser"
      :pk="pk"
    />
  </div>
</template>

<script>
import OrderFormMaintenancePlanning from "./OrderFormMaintenancePlanning.vue"
import OrderFormMaintenanceCustomer from "./OrderFormMaintenanceCustomer.vue"
import OrderFormMaintenanceEmployee from "./OrderFormMaintenanceEmployee.vue"
import { componentMixin } from '../../utils.js'

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
    OrderFormMaintenanceEmployee
  },
}
</script>

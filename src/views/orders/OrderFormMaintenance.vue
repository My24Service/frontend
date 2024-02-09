<template>
  <div>
    <OrderFormMaintenancePlanning
      v-if="isPlanning || isStaff || isSuperuser"
      :pk="pk"
      :unaccepted="unaccepted"
      :maintenance="maintenance"
      :from_quotation="from_quotation"
      :quotation_id="quotation_id"
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
import { componentMixin } from '@/utils'

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
    from_quotation: {
      type: [Boolean],
      default: false
    },
    quotation_id: {
      type: [String, Number],
      default: null
    },
  },
  components: {
    OrderFormMaintenancePlanning,
    OrderFormMaintenanceCustomer,
    OrderFormMaintenanceEmployee
  },
}
</script>

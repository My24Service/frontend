<template>
  <div>
    <OrderFormMaintenancePlanning v-if="!isCustomer" :pk="pk" />
    <OrderFormMaintenanceCustomer v-if="isCustomer" :pk="pk" />
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
  },
  components: {
    OrderFormMaintenancePlanning,
    OrderFormMaintenanceCustomer,
  },
}
</script>

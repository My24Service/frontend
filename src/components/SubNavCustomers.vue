<template>
  <div>
    <b-nav tabs>
      <b-nav-item
        :active="isActive('customers')"
        v-if="hasCustomers"
        :to="{ name: 'customer-list' }">
        {{ $trans('Customers') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('all-maintenance-products')"
        v-if="hasAllMaintenanceProducts"
        :to="{ name: 'all-maintenance-products' }">
        {{ $trans('All maintenance products') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('maintenance-order-year')"
        v-if="hasMaintenanceOrdersPerYear"
        :to="{ name: 'maintenance-order-year' }">
        {{ $trans('Maintenance orders/year') }}
      </b-nav-item>
    </b-nav>
  </div>
</template>

<script>
import { componentMixin } from '@/utils.js'

export default {
  mixins: [componentMixin],
  methods: {
    isActive(item) {
      const parts = this.$route.path.split('/')
      return parts[2] === item
    }
  },
  computed: {
    hasCustomers() {
      return this.hasAccessToModule('customers', 'customers')
    },
    hasAllMaintenanceProducts() {
      return this.hasAccessToModule('customers', 'all-maintenance-products')
    },
    hasMaintenanceOrdersPerYear() {
      return this.hasAccessToModule('customers', 'maintenance-order-year')
    },
  },
}
</script>

<style scoped>
</style>

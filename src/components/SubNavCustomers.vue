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
        :active="isActive('maintenance-contracts') || isActive('maintenance-products')"
        v-if="hasMaintenanceContracts"
        :to="{ name: 'maintenance-contracts' }">
        {{ $trans('Maintenance contracts') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('maintenance-order-year')"
        v-if="hasMaintenanceOrdersPerYear"
        :to="{ name: 'maintenance-order-year' }">
        {{ $trans('Maintenance orders/year') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('calendar')"
        v-if="hasMaintenanceOrdersPerYear"
        :to="{ name: 'maintenance-products-calendar' }">
        {{ $trans('Calendar') }}
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
    hasMaintenanceContracts() {
      return this.hasAccessToModule('customers', 'maintenance-contracts')
    },
    hasMaintenanceOrdersPerYear() {
      return this.hasAccessToModule('customers', 'maintenance-order-year')
    },
  },
}
</script>

<style scoped>
</style>

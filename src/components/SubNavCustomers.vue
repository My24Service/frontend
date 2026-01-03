<template>
  <div>
    <b-nav-item
      :active="isActive('dashboard')"
      v-if="showCustomerDashBoard"
      :to="{name: 'customer-dashboard'}">
      {{ $trans('Dashboard') }}
    </b-nav-item>
      <!-- <b-nav-item
        :active="isActive('customers')"
        v-if="hasCustomers"
        :to="{ name: 'customer-list' }">
        {{ $trans('Customers') }}
      </b-nav-item> -->
      <b-nav-item
        :active="isActive('maintenance-contracts') || isActive('maintenance-products')"
        v-if="hasMaintenanceContracts"
        :to="{ name: 'maintenance-contracts' }">
        {{ $trans('Maintenance contracts') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('equipment')"
        v-if="hasEquipment"
        :to="{ name: 'customers-equipment-list' }">
        {{ $trans('Equipment') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('locations')"
        v-if="hasEquipmentLocations"
        :to="{ name: 'customers-location-list' }">
        {{ $trans('Locations') }}
      </b-nav-item>
<!--      <b-nav-item-->
<!--        :active="isActive('calendar')"-->
<!--        v-if="hasMaintenanceOrdersPerYear"-->
<!--        :to="{ name: 'maintenance-products-calendar' }">-->
<!--        {{ $trans('Calendar') }}-->
<!--      </b-nav-item>-->

  </div>
</template>

<script>

import componentMixin from "@/mixins/common";

export default {
  mixins: [componentMixin],
  methods: {
    isActive(item) {
      const parts = this.$route.path.split('/')
      return parts[2] === item
    }
  },
  computed: {
    hasEquipment() {
      return this.hasAccessToModule('customers', 'equipment') && !this.isCustomer
    },
    hasEquipmentLocations() {
      return this.hasAccessToModule('customers', 'locations') && !this.isCustomer
    },
    hasMaintenanceContracts() {
      return this.hasAccessToModule('customers', 'maintenance-contracts')
    },
    hasMaintenanceOrdersPerYear() {
      return this.hasAccessToModule('customers', 'maintenance-order-year')
    },
    showCustomerDashBoard() {
      return !this.hasBranches && this.isCustomer
    },
  },
}
</script>

<style scoped>
</style>

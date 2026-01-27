<template>
  <div>
      <b-nav-item
        :active="isActive('purchaseorders')"
        v-if="hasPurchaseOrders"
        :to="{ name: 'purchaseorder-list' }">
        {{ $trans('Purchase orders') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('purchaseorder-entries')"
        v-if="hasPurchaseOrderEntries"
        :to="{ name: 'purchaseorder-entry-list' }">
        {{ $trans('Entries') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('materials')"
        v-if="hasMaterials"
        :to="{ name: 'material-list' }">
        {{ $trans('Materials') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('suppliers')"
        v-if="hasSuppliers"
        :to="{ name: 'supplier-list' }">
        {{ $trans('Suppliers') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('supplier-reservations')"
        v-if="false && hasSupplierReservations"
        :to="{ name: 'supplier-reservation-list' }">
        {{ $trans('Reservations') }}
      </b-nav-item>

      <b-nav-item
        :active="isActive('stock-locations')"
        v-if="hasStockLocations"
        :to="{ name: 'stock-location-list' }">
        {{ $trans('Locations') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('mutations')"
        v-if="hasMutations"
        :to="{ name: 'mutation-list' }">
        {{ $trans('Mutations') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('move-material')"
        v-if="hasMoveMaterial"
        :to="{ name: 'material-move' }">
        {{ $trans('Move') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('stats')"
        v-if="hasStats"
        :to="{ name: 'inventory-stats' }">
        {{ $trans('Statistics') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('stats-table')"
        v-if="hasStats"
        :to="{ name: 'inventory-stats-table' }">
        {{ $trans('Statistics table') }}
      </b-nav-item>
  </div>
</template>

<script>
import {$trans} from "@/utils";

export default {

  methods: {
    $trans,
    isActive(item) {
      const parts = this.$route.path.split('/')
      return parts[2] === item
    }
  },
  computed: {
    hasPurchaseOrders() {
      return this.hasAccessToModule('inventory', 'purchaseorders')
    },
    hasPurchaseOrderEntries() {
      return this.hasAccessToModule('inventory', 'purchaseorder-entries')
    },
    hasMaterials() {
      return this.hasAccessToModule('inventory', 'materials')
    },
    hasSuppliers() {
      return this.hasAccessToModule('inventory', 'suppliers')
    },
    hasSupplierReservations() {
      return this.hasAccessToModule('inventory', 'supplier-reservations')
    },
    hasStockLocations() {
      return this.hasAccessToModule('inventory', 'stock-locations')
    },
    hasMutations() {
      return this.hasAccessToModule('inventory', 'mutations')
    },
    hasMoveMaterial() {
      return this.hasAccessToModule('inventory', 'move-material')
    },
    hasStats() {
      return this.hasAccessToModule('inventory', 'stats')
    },
  },
}
</script>

<style scoped>
</style>

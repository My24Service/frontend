<template>
  <div>
    <b-nav tabs>
      <b-nav-item
        :active="isActive('orders')"
        v-if="hasOrders"
        :to="{ name: 'order-list' }">
        {{ $trans('Orders') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('orders-not-accepted')"
        v-if="hasNotAcceptedOrders"
        :to="{ name: 'orders-not-accepted' }">
        {{ $trans('Not accepted orders') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('past-orders')"
        v-if="hasPastOrders"
        :to="{ name: 'past-order-list' }">
        {{ $trans('Past orders') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('sales-orders')"
        v-if="hasSalesOrders"
        :to="{ name: 'order-list-sales' }">
        {{ $trans('Sales orders') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('workorder-orders')"
        v-if="hasWorkorderOrders"
        :to="{ name: 'workorder-orders' }">
        {{ $trans('Workorder orders') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('statuscodes')"
        v-if="hasStatuscodes"
        :to="{ name: 'order-statuscode-list' }">
        {{ $trans('Statuscodes') }}
      </b-nav-item>
      <b-nav-item
        :active="isActive('year-stats')"
        v-if="hasYearStats"
        :to="{ name: 'order-year-stats' }">
        {{ $trans('Year') }}
      </b-nav-item>
      <b-nav-item :active="isActive('month-stats')" v-if="hasMonthStats" to="/orders/month-stats">
        {{ $trans('Month') }}
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
    hasOrders() {
      return this.hasAccessToModule('orders', 'orders');
    },
    hasNotAcceptedOrders() {
      return this.hasAccessToModule('orders', 'orders-not-accepted');
    },
    hasPastOrders() {
      return this.hasAccessToModule('orders', 'past-orders');
    },
    hasSalesOrders() {
      return this.hasAccessToModule('orders', 'sales-orders');
    },
    hasWorkorderOrders() {
      return this.hasAccessToModule('orders', 'workorder-orders');
    },
    hasStatuscodes() {
      return this.hasAccessToModule('orders', 'statuscodes');
    },
    hasYearStats() {
      return this.hasAccessToModule('orders', 'year-stats');
    },
    hasMonthStats() {
      return this.hasAccessToModule('orders', 'month-stats');
    },
  },
}
</script>

<style scoped>
</style>

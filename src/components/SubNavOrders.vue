<template>
  <div>
    <b-nav-item
      :active="isActive('statuscodes')"
      v-if="isStaff || isSuperuser || (hasStatuscodes && isPlanning)"
      :to="{ name: 'order-statuscode-list' }">
      {{ $trans('Statuscodes') }}
    </b-nav-item>
    <b-nav-item
      :active="isActive('year-stats')"
      v-if="isStaff || isSuperuser || (hasYearStats && (isPlanning || isSales || isCustomer || isBranchEmployee))"
      :to="{ name: 'order-year-stats' }">
      {{ $trans('Year') }}
    </b-nav-item>
    <b-nav-item
      :active="isActive('month-stats')"
      v-if="isStaff || isSuperuser || (hasMonthStats && (isPlanning || isSales || isCustomer || isBranchEmployee))"
      to="/orders/month-stats">
      {{ $trans('Month') }}
    </b-nav-item>
  </div>
</template>

<script>
import { componentMixin } from '@/utils'

export default {
  mixins: [componentMixin],
  methods: {
    isActive(item) {
      const parts = this.$route.path.split('/')
      return parts[2] === item
    }
  },
  data() {
    return {
    }
  },
  computed: {
    hasOrders() {
      return this.hasAccessToModule('orders', 'orders')
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
    unacceptedCount() {
      return this.$store.state.unacceptedCount
    }
  },
  watch: {
    unacceptedCount (oldValue, newValue) {
    }
  }
}
</script>

<style scoped>
</style>

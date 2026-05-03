<template>
  <b-nav>
    <b-nav-item
      v-if="hasBranches"
      :active="isActive('schedule')"
      :to="{name: 'orders-schedule'}">
      {{ $trans('Schedule') }}
    </b-nav-item>
    <b-nav-item
      v-if="isPlanning || isAdmin"
      :active="isActive('statuscodes')"
      to="/orders/statuscodes">
      {{ $trans('Statuscodes') }}
    </b-nav-item>
    <b-nav-item
      :active="isActive('year-stats') || isActive('month-stats')"
      to="/orders/year-stats">
      {{ $trans('Stats') }}
    </b-nav-item>
    <b-nav-item
      :active="isActive('filter')"
      v-if="isAdmin || isPlanning"
      :to="{ name: 'order-filter-list' }">
      {{ $trans('Filters') }}
    </b-nav-item>
  </b-nav>
</template>

<script>
import {$trans} from "@/utils";
import {useMainStore} from "@/stores/main";
import componentMixin from "@/mixins/common";

export default {
  setup() {
    const mainStore = useMainStore()

    return {
      mainStore
    }
  },
  mixins: [componentMixin],
  methods: {
    $trans,
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
      return this.mainStore.unacceptedCount
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

<template>
  <component :is="activeComponent" />
</template>

<script>
import DashboardOverviewShltr from './dashboard_view/DashboardOverviewShltr.vue'
import Dashboard from '../dashboard/Dashboard.vue'
import {isShltrTheme} from '@/theme'

// The overview page only exists in the shltr design; a default-family tenant
// hitting this route gets the regular dashboard.
export default {
  components: {
    DashboardOverviewShltr,
    Dashboard
  },
  computed: {
    activeComponent() {
      return isShltrTheme ? 'DashboardOverviewShltr' : 'Dashboard';
    }
  }
}
</script>

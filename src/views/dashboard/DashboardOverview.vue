<template>
  <component :is="activeComponent" />
</template>

<script>
import DashboardOverviewShltr from './dashboard_view/DashboardOverviewShltr.vue'
import DashboardDefault from './dashboard_view/DashboardDefault.vue'
import {isShltrTheme} from '@/theme'

// The overview page only exists in the new (shltr) design. Falling back to the
// existing dashboard keeps theme-default free of any Tailwind-styled screen,
// should a default-theme tenant ever hit this route.
export default {
  components: {
    DashboardOverviewShltr,
    DashboardDefault
  },
  computed: {
    activeComponent() {
      return isShltrTheme ? 'DashboardOverviewShltr' : 'DashboardDefault';
    }
  }
}
</script>

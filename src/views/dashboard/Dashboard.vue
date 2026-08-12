<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <component :is="activeComponent" />
</template>

<script>
import DashboardShltr from './dashboard_view/DashboardShltr.vue'
import DashboardDefault from './dashboard_view/DashboardDefault.vue'
import {isShltrTheme} from '@/theme'

export default {
  components: {
    DashboardShltr,
    DashboardDefault
  },
  computed: {
    activeComponent() {
      return isShltrTheme ? 'DashboardShltr' : 'DashboardDefault';
    }
  }
}
</script>

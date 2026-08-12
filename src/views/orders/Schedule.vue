<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <component :is="activeComponent" v-bind="$props" />
</template>

<script>
import ScheduleShltr from './schedule/ScheduleShltr.vue'
import ScheduleDefault from './schedule/ScheduleDefault.vue'
import {isShltrTheme} from '@/theme'

export default {
  name: "OrdersSchedule",
  components: {
    ScheduleShltr,
    ScheduleDefault
  },
  props: {
    start: {
      type: [String],
      default: null
    },
    end: {
      type: [String],
      default: null
    },
  },
  computed: {
    activeComponent() {
      return isShltrTheme ? 'ScheduleShltr' : 'ScheduleDefault';
    }
  }
}
</script>

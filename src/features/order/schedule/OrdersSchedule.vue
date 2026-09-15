<template>
  <component :is="isShltrTheme ? ScheduleShltr : ScheduleDefault" />
</template>

<script lang="ts" setup>
import { isShltrTheme } from '@/theme'
import ScheduleDefault from './ScheduleDefault.vue'
import ScheduleShltr from './ScheduleShltr.vue'

/**
 * The orders schedule, in whichever design the build's theme picks. The
 * `start`/`end` route params the legacy declared were never read by either
 * design and are not taken here.
 */
</script>

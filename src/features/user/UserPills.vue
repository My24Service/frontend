<template>
  <PillsNav :items="pills" />
</template>

<script lang="ts" setup>
import PillsNav, { useCompanyUserPills } from '@/components/PillsNav.vue'

/**
 * The pills that switch between the user lists (engineers, students, sales,
 * customers, planning, employees, API). The sidebar's "People" entry lands on
 * only one of them; these pills are how the others are reached.
 * `fromSettings` keeps the planning and employees pills inside the settings
 * tree when the list is mounted there.
 */
const props = withDefaults(defineProps<{
  fromSettings?: boolean
}>(), {
  fromSettings: false,
})

const pills = useCompanyUserPills(props.fromSettings)
</script>

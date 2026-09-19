<template>
  <BNav pills>
    <BNavItem
      v-for="item in visibleItems"
      :key="item.to.name"
      :active="route.name === item.to.name"
      :to="item.to"
    >
      {{ item.label }}
    </BNavItem>
  </BNav>
</template>

<script lang="ts">
import { useMainStore } from '@/stores/main'
import { $trans } from '@/services/i18n'
import { hasAccessToModule } from '@/utils'

/**
 * One entry in a pills subnav. `guard` hides the pill; omit it (or pass
 * anything but false) and the pill shows. Active state compares the current
 * route name to the pill's target, replacing the old path-segment indexes
 * ([2] in some pills, [3] in others).
 */
export interface PillNavItem {
  label: string
  to: { name: string }
  guard?: boolean
}

/**
 * The company-users pills (engineers/students/sales/customers/planning/
 * employees/API) as computed items for PillsNav, replacing the bespoke
 * PillsCompanyUsers component. Guard logic is a verbatim port: member-type,
 * flavour and module-contract checks, plus the from_settings planning route
 * (the employees pill always pointed at the settings route; kept as-is).
 */
export function useCompanyUserPills(fromSettings = false): ComputedRef<PillNavItem[]> {
  const mainStore = useMainStore()

  return computed<PillNavItem[]>(() => {
    const hasBranches = mainStore.getMemberHasBranches
    const memberType = mainStore.getMemberType

    return [
      {
        label: $trans('Engineers'),
        to: { name: 'users-engineers' },
        guard: !hasBranches && memberType === 'maintenance' && hasAccessToModule('company', 'engineer-users'),
      },
      {
        label: $trans('Students'),
        to: { name: 'users-studentusers' },
        guard: mainStore.getFlavour === 'temps' && hasAccessToModule('company', 'student-users'),
      },
      {
        label: $trans('Sales'),
        to: { name: 'users-salesusers' },
        guard: !hasBranches && hasAccessToModule('company', 'sales-users'),
      },
      {
        label: $trans('Customers'),
        to: { name: 'users-customerusers' },
        guard: !hasBranches && hasAccessToModule('company', 'customer-users'),
      },
      {
        label: $trans('Planning'),
        to: { name: fromSettings ? 'settings-users-planningusers' : 'users-planningusers' },
      },
      {
        label: $trans('Employees'),
        to: { name: 'settings-users-employees' },
      },
      {
        label: $trans('API'),
        to: { name: 'users-apiusers' },
        guard: mainStore.getMemberHasApiUsers,
      },
    ]
  })
}
</script>

<script lang="ts" setup>
const props = defineProps<{
  items: PillNavItem[]
}>()

const route = useRoute()

const visibleItems = computed(() => props.items.filter((item) => item.guard !== false))
</script>

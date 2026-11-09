<template>
  <BNav pills class="pills-nav">
    <BNavItem
      v-for="item in visibleItems"
      :key="item.to.name"
      :active="route.name === item.to.name"
      :to="toRoute(item.to.name)"
    >
      {{ item.label }}
    </BNavItem>
  </BNav>
</template>

<script lang="ts">
import { hasAccessToModule } from '@/utils'

/**
 * One entry in a pills subnav. `guard` hides the pill; omit it (or pass
 * anything but false) and the pill shows. Active state compares the current
 * route name to the pill's target, replacing the old path-segment indexes
 * ([2] in some pills, [3] in others).
 */
export interface PillNavItem {
  label: string
  to: { name: RouteName }
  guard?: boolean
}

/**
 * The company-users pills (engineers/students/sales/customers/planning/
 * employees/API) as computed items for PillsNav, replacing the bespoke
 * PillsCompanyUsers component. Guard logic is a verbatim port: member-type,
 * flavour and module-contract checks. `fromSettings` points the planning and
 * employees pills at the settings tree's routes.
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
        to: { name: fromSettings ? 'settings-users-employees' : 'users-employees' },
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

<style scoped>
/* Bootstrap's inactive pill takes the theme link colour, which on the default
   theme is the same orange as the page band the pills sit on, so it vanished.
   It takes the surrounding text colour instead (dark on shltr), and on the
   default theme the white of the page title above it. Same problem as
   StatuscodePills. */
.pills-nav :deep(.nav-link:not(.active)) {
  color: inherit;
}
/* The active pill's background is the theme's primary colour, which on the
   default theme is also the header's; a ring in the pill's own text colour
   keeps it visible there and disappears into the white shltr header. */
.pills-nav :deep(.nav-link.active) {
  box-shadow: 0 0 0 2px currentColor;
}
</style>

<style>
/* Unscoped: the theme class sits on <html>, outside this component. */
:root.theme-default .pills-nav .nav-link:not(.active) {
  color: white;
}
</style>

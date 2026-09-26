<template>
  <div>
    <PillsNav :items="userPills" />
    <BNav pills class="pills-small">
      <BNavItem
        v-for="item in items"
        :key="item.name"
        :active="route.name === item.name"
        :to="toRoute(item.name)"
      >
        {{ item.label() }}
      </BNavItem>
    </BNav>
  </div>
</template>

<script lang="ts" setup>
import PillsNav, {useCompanyUserPills} from '@/components/PillsNav.vue'
import type { PillNavItem } from '@/components/PillsNav.vue'
/**
 * The chrome both event screens carry: the company-user pills row above, and
 * this Slice's own List / Events / Event types row below it, one size down.
 *
 * The rows are the legacy screen's, exactly: `PillsNav` with
 * `useCompanyUserPills()` (whose entries already carry their own module,
 * member-type and flavour guards) and the engineer row the legacy
 * `PillsEngineer.vue` drew. The class name stays `pills-small` so the size
 * rule and the specs' selector survive the move.
 *
 * Two things the legacy row did differently, both recorded in the Slice
 * README's ledger:
 *
 *  - it rendered only when the tenant's company code was `grm`. Nothing in
 *    this application branches on a company code (AGENTS.md: family comes from
 *    `profile.family`, flavour from `profile.flavour`), and the three entries
 *    are this Slice's navigation, not a per-tenant product decision — the same
 *    removal `features/workforce/SubNav.vue` made for its own row. The
 *    sibling precedent for the product difference behind that code is
 *    `dispatch/EngineerMap.vue`, whose companycode blocklist moved to the nav
 *    section's `profile.flavour`.
 *  - it derived the active entry from `$route.path.split('/')`, whose
 *    four-segment reply marked "List" active on every event screen — including
 *    the two that are not the list. The active entry is the route's name, the
 *    way `PillsNav` settled the same question.
 */
const route = useRoute()
/**
 * The company-user pills. `useCompanyUserPills` is a named export of a `.vue`
 * module, which the type-checked lint resolves through the stock `*.vue`
 * shim (default export only - see the typescriptSfcs note in
 * eslint.config.js), so the factory arrives untyped; the guard recovers its
 * static type without a cast.
 */
function isPillsFactory(value: unknown): value is () => ComputedRef<PillNavItem[]> {
  return typeof value === 'function'
}
const pillsFactory: unknown = useCompanyUserPills
const userPills: ComputedRef<PillNavItem[]> = isPillsFactory(pillsFactory)
  ? pillsFactory()
  : computed<PillNavItem[]>(() => [])

const items: {name: RouteName; label: () => string}[] = [
  {name: 'users-engineers', label: () => $trans('List')},
  {name: 'engineer-event-list', label: () => $trans('Events')},
  {name: 'engineer-event-type-list', label: () => $trans('Event types')},
]
</script>

<style scoped>
.pills-small :deep(.nav-link) {
  font-size: 12px;
}
</style>

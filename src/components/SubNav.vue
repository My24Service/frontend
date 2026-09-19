<template>
  <div ref="page-subnav" class="page-subnav">
    <BNav>
      <BNavItem
        v-for="item in visibleItems"
        :key="item.label"
        :active="isSubActive(item)"
        :to="resolveTo(item)"
      >
        {{ $trans(item.label) }}
        <BBadge v-if="item.badge === 'requestedCount' && requestedCount > 0" variant="light">{{ requestedCount }}</BBadge>
      </BNavItem>
    </BNav>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/features/auth/store'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import { hasAccessToModule as checkModuleAccess } from '@/utils'
import { SUBNAV_SECTIONS, type NavCtx, type SubNavItem } from '@/components/navSections'
import { useRequestedCount } from '@/components/the_nav/useNav'

// One config-driven subnav for every section. The router registers this
// component for each `app-subnav` outlet with a `section` prop
// (`props: { 'app-subnav': { section: 'orders' } }`); `items` overrides the
// section config item-for-item ({ label, to: { name }, guard? }).
// Active state is by route NAME (each item lists the names it stays active
// on), which replaces the per-file $route.path splits.
const props = withDefaults(defineProps<{
  section?: string
  items?: SubNavItem[] | null
}>(), {
  section: '',
  items: null,
})

const route = useRoute()
const mainStore = useMainStore()
const authStore = useAuthStore()
const { requestedCount, loadRequestedCount } = useRequestedCount()

// The members section always fetches the requested-members count for the
// Requested badge (no role guard around the call itself; the routes are
// staff-meta guarded).
if (props.section === 'members') {
  loadRequestedCount()
}

const sectionItems = computed<SubNavItem[]>(() =>
  props.items ?? SUBNAV_SECTIONS[props.section] ?? [])

const navCtx = computed<NavCtx>(() => ({
  // All lazy getters: a section only evaluates the guards it declares,
  // and several store getters read through memberInfo, which callers
  // mounting another section never seed.
  hasAccessToModule: (module, part) => checkModuleAccess(module, part),
  get isAdmin() { return authStore.isAdmin },
  get isPlanning() { return authStore.isPlanning },
  get isStaff() { return authStore.isStaff },
  get isSuperuser() { return authStore.isSuperuser },
  get isCustomer() { return authStore.isCustomer },
  get isBranchEmployee() { return authStore.isBranchEmployee },
  get hasBranches() { return mainStore.getMemberHasBranches },
  get flavour() { return mainStore.getFlavour },
  get memberType() { return mainStore.getMemberType },
}))

const visibleItems = computed<SubNavItem[]>(() =>
  sectionItems.value.filter((item) => isShown(item)))

function isShown(item: SubNavItem): boolean {
  if (typeof item.show === 'function') {
    return item.show(navCtx.value)
  }
  return item.show !== false
}

function resolveTo(item: SubNavItem): RouteLocationRaw {
  if (typeof item.to === 'function') {
    return item.to(navCtx.value)
  }
  return item.to
}

function defaultActiveNames(to: SubNavItem['to']): string[] {
  if (typeof to !== 'object' || to === null || !('name' in to)) return []
  const name = to.name
  return typeof name === 'string' ? [name] : []
}

function isSubActive(item: SubNavItem): boolean {
  const names = item.active ?? defaultActiveNames(item.to)
  const routeName = route.name
  return typeof routeName === 'string' && names.includes(routeName)
}
</script>

<style scoped>
</style>

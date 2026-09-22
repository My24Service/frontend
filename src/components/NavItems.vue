<template>
  <div class="nav-items" :class="modeClass" ref="nav-items" v-if="userInfo.user">
    <template v-if="mode === 'default'">
      <!-- Orders -->
      <BNavItem
        :active="isTopActive('orders')"
        v-if="hasOrders && (isPlanning || isStaff || isSuperuser || isCustomer || isBranchEmployee)"
        to="/orders/orders"
        class="has-children">
        <IBiFileEarmarkTextFill v-if="!isTopActive('orders')"></IBiFileEarmarkTextFill>
        <IBiFileEarmarkText v-else></IBiFileEarmarkText>
        <span style="flex-grow:1">{{ $trans('Orders') }}</span>
        <BBadge
          v-if="unacceptedCount && unacceptedCount > 0"
          variant="light"
          :title="`${unacceptedCount} ${$trans('Unaccepted orders')}`"
        >{{ unacceptedCount }}</BBadge>
        &nbsp;
      </BNavItem>
      <router-view v-if="isTopActive('orders')" name="app-subnav"></router-view>

      <BNavItem
        :active="isTopActive('invoices')"
        v-if="hasInvoices && (isPlanning || isStaff || isSuperuser || isCustomer || isBranchEmployee)"
        class="has-children"
        to="/invoices/invoices">
        <IBiReceiptCutoff></IBiReceiptCutoff>
        {{ $trans('Invoices') }}
      </BNavItem>
      <router-view v-if="isTopActive('invoices')" name="app-subnav"></router-view>

      <!-- equipment -->
      <BNavItem
        :active="isTopActive('equipment')"
        v-if="showEquipment"
        :to="{ name: 'equipment-equipment-list', params: { type: EQUIPMENT_TYPES.TECHNICAL } }"
        class="has-children">
        <IBiBriefcase v-if="!isTopActive('equipment')"></IBiBriefcase>
        <IBiBriefcaseFill v-if="isTopActive('equipment')"></IBiBriefcaseFill>
        {{ $trans('Equipment') }}
      </BNavItem>
      <router-view v-if="isTopActive('equipment')" name="app-subnav"></router-view>

      <!-- customers -->
      <BNavItem
        :active="isTopActive('customers')"
        v-if="showCustomers"
        :to="{name: 'customer-list'}"
        class="has-children">
        <IBiBuilding v-if="!isTopActive('customers')"></IBiBuilding>
        <IBiBuildingFill v-else></IBiBuildingFill>
        {{ $trans('Customers') }}
      </BNavItem>
      <router-view v-if="isTopActive('customers')" name="app-subnav"></router-view>

      <!-- inventory -->
      <BNavItem
        :active="isTopActive('inventory')"
        v-if="showInventory"
        to="/inventory/stats-table"
        class="has-children">
        <IBiCollection v-if="!isTopActive('inventory')"></IBiCollection>
        <IBiCollectionFill v-else></IBiCollectionFill>
        {{ $trans('Inventory') }}
      </BNavItem>
      <router-view v-if="isTopActive('inventory')" name="app-subnav"></router-view>

      <!-- mobile -->
      <BNavItem
        :active="isTopActive('mobile')"
        v-if="showMobile"
        to="/mobile/dispatch"
        class="has-children">
        <IBiPersonBadge v-if="!isTopActive('mobile')"></IBiPersonBadge>
        <IBiPersonBadgeFill v-else></IBiPersonBadgeFill>
        {{ $trans('Mobile') }}
      </BNavItem>
      <router-view v-if="isTopActive('mobile')" name="app-subnav"></router-view>

      <BNavItem
        :active="isTopActive('quotations')"
        v-if="hasQuotations && (isPlanning || isStaff || isSuperuser || isCustomer || isBranchEmployee)"
        class="has-children"
        to="/quotations/quotations">
        <IBiBriefcase v-if="!isTopActive('quotations')"></IBiBriefcase>
        <IBiBriefcaseFill v-else></IBiBriefcaseFill>
        {{ $trans('Quotations') }}
      </BNavItem>

      <BNavItem
        :active="isTopActive('company')"
        v-if="showCompany"
        :to="{name: getCompanyRouteTo}"
        class="has-children">
        <IBiBookmarkStar v-if="!isTopActive('company')"></IBiBookmarkStar>
        <IBiBookmarkStarFill v-else></IBiBookmarkStarFill>
        {{ $trans('My company') }}
      </BNavItem>
      <router-view v-if="isTopActive('company')" name="app-subnav"></router-view>

      <!-- members -->
      <BNavItem
        :active="isTopActive('members')"
        v-if="showMembers"
        to="/members/members"
        class="has-children">
        <IBiPeople v-if="isTopActive('members')"></IBiPeople>
        <IBiPeopleFill v-else></IBiPeopleFill>
        {{ $trans('Members') }}
        <BBadge v-if="requestedCount > 0" variant="light">{{ requestedCount }}</BBadge>
      </BNavItem>
      <router-view v-if="isTopActive('members')" name="app-subnav"></router-view>

      <!-- BIM / 3D -->
      <BNavItem
        v-if="hasBim"
        :to="{name: 'bim-frame'}"
        :active="isTopActive('bim')"
        >
        <IBiMouse2 v-if="!isTopActive('bim')"></IBiMouse2>
        <IBiMouse2Fill v-else></IBiMouse2Fill>
        {{ $trans('3D Module') }}
      </BNavItem>
      <router-view v-if="isTopActive('bim')" name="app-subnav"></router-view>

      <!-- webshop -->
      <BNavItem
        v-if="hasWebshop"
        to="/webshop"
        :active="isTopActive('webshop')"
        >
        <IBiBasket v-if="!isTopActive('webshop')"></IBiBasket>
        <IBiBasketFill v-else></IBiBasketFill>
        {{ $trans('Webshop') }}
      </BNavItem>
      <router-view v-if="isTopActive('webshop')" name="app-subnav"></router-view>
    </template>

    <template v-else-if="mode === 'branch'">
      <BNavItem v-if="!isDefaultFamily" :to="{name: 'dashboard-overview'}">
        <IBiGridFill v-if="isTopActive('overview')"></IBiGridFill>
        <IBiGrid v-else></IBiGrid>
        {{ $trans('Overview') }}
      </BNavItem>

      <BNavItem :to="{name: 'dashboard'}">
        <IBiClockFill v-if="isTopActive('dashboard')"></IBiClockFill>
        <IBiClock v-else></IBiClock>
        {{ $trans('Dashboard') }}
      </BNavItem>

      <BNavItem :to="{name: 'order-list'}">
        <IBiClipboard2Fill v-if="isSubActive(navLists.branchOrders)"></IBiClipboard2Fill>
        <IBiClipboard2 v-else></IBiClipboard2>
        {{ $trans('Orders') }}
      </BNavItem>

      <BNavItem :to="{name: 'orders-schedule'}">
        <IBiBriefcaseFill v-if="isSubActive(navLists.branchPlanning)"></IBiBriefcaseFill>
        <IBiBriefcase v-else></IBiBriefcase>
        {{ $trans('Planning') }}
      </BNavItem>

      <BNavItem
        :to="{name: 'equipment-equipment-list', params: { type: EQUIPMENT_TYPES.TECHNICAL }}"
        :active="isEquipmentTypeActive(EQUIPMENT_TYPES.TECHNICAL)"
      >
        <IBiWrenchAdjustableCircleFill v-if="!isEquipmentTypeActive(EQUIPMENT_TYPES.TECHNICAL)"></IBiWrenchAdjustableCircleFill>
        <IBiWrenchAdjustableCircle v-else></IBiWrenchAdjustableCircle>
        {{ $trans('Technical') }}
      </BNavItem>

      <BNavItem
        :to="{name: 'equipment-equipment-list', params: { type: EQUIPMENT_TYPES.FACILITY }}"
        :active="isEquipmentTypeActive(EQUIPMENT_TYPES.FACILITY)"
      >
        <IBiBuildingsFill v-if="!isEquipmentTypeActive(EQUIPMENT_TYPES.FACILITY)"></IBiBuildingsFill>
        <IBiBuildings v-else></IBiBuildings>
        {{ $trans('Facility') }}
      </BNavItem>

      <BNavItem :to="{name: 'equipment-location-list'}">
        <IBiGeoAltFill v-if="!isSubActive(navLists.equipmentLocations)"></IBiGeoAltFill>
        <IBiGeoAlt v-else></IBiGeoAlt>
        {{ $trans('Locations') }}
      </BNavItem>
    </template>

    <template v-else-if="mode === 'settings'">
      <BNavItem
        v-if="!isBranchEmployee"
        :to="{name: 'settings-company'}"
        :active="isSubActive(navLists.settingsCompany)"
      >
        {{ $trans('Company') }}
      </BNavItem>

      <BNavItem
        v-if="!isBranchEmployee"
        :to="{ name: 'settings-company-import-list' }"
        :active="isSubActive(navLists.settingsImport)">
        {{ $trans('Import') }}
      </BNavItem>

      <BNavItem
        :to="usersRoute"
        :active="isSubActive(navLists.settingsUsers)"
      >
        {{ $trans('Users') }}
      </BNavItem>

      <BNavItem
        v-if="!isBranchEmployee"
        :to="{name: 'settings-order-statuscode-list'}"
        :active="isSubActive(navLists.settingsStatuses)"
      >
        {{ $trans('Statuses') }}
      </BNavItem>

      <BNavItem
        v-if="!isBranchEmployee"
        :to="{name: 'settings-order-filter-list'}"
        :active="isSubActive(navLists.settingsFilters)"
      >
        {{ $trans('Filters') }}
      </BNavItem>

      <BNavItem
        v-if="!isBranchEmployee"
        :to="{name: 'settings-branches'}"
        :active="isSubActive(navLists.settingsBranches)"
      >
        {{ $trans('Branches') }}
      </BNavItem>

      <BNavItem
        v-if="isBranchEmployee"
        :to="{name: 'settings-my-branch'}"
        :active="isSubActive(navLists.settingsMyBranch)"
      >
        {{ $trans('My branch') }}
      </BNavItem>

      <BNavItem
        :to="{name: 'settings-equipment-list', params: {type: EQUIPMENT_TYPES.TECHNICAL}}"
        :active="isEquipmentTypeActive(EQUIPMENT_TYPES.TECHNICAL)"
      >
        {{ $trans('Technical') }}
      </BNavItem>

      <BNavItem
        :to="{name: 'settings-equipment-list', params: {type: EQUIPMENT_TYPES.FACILITY}}"
        :active="isEquipmentTypeActive(EQUIPMENT_TYPES.FACILITY)"
      >
        {{ $trans('Facility') }}
      </BNavItem>

      <BNavItem
        :to="{name: 'settings-location-list'}"
        :active="isSubActive(navLists.settingsLocations)"
      >
        {{ $trans('Locations') }}
      </BNavItem>
    </template>

  </div>
</template>

<script setup lang="ts">
import { EQUIPMENT_TYPES } from '@/constants'
import { hasAccessToModule } from '@/utils'
import { useNav, useRequestedCount } from '@/components/the_nav/useNav'
import {
  BRANCH_ORDER_ROUTES,
  BRANCH_PLANNING_ROUTES,
  SETTINGS_BRANCH_ROUTES,
  SETTINGS_FILTER_ROUTES,
  SETTINGS_IMPORT_ROUTES,
  SETTINGS_STATUSCODE_ROUTES,
  SETTINGS_USER_ROUTES,
  locationRoutes,
} from '@/components/navSections'

// One sidebar menu for the three shells TheSidebar switches between:
// mode "default", "branch" and "settings". Guards, links, badges and outlets are unchanged per
// mode; the setup/stores/requestedCount fetch that was copied across all three
// files now lives here once, via useNav()/useRequestedCount().
export type NavMode = 'default' | 'branch' | 'settings'

const props = withDefaults(defineProps<{
  mode?: NavMode
}>(), {
  mode: 'default',
})

const mainStore = useMainStore()
const authStore = useAuthStore()

const { isTopActive, isSubActive, isEquipmentTypeActive } = useNav()
const { requestedCount, loadRequestedCount } = useRequestedCount()

// The store is untyped JS, so each read is assigned into an explicitly
// annotated computed rather than cast.
const userInfo = computed<{ user?: unknown }>(() => authStore.userInfo ?? {})
const isStaff = computed<boolean>(() => authStore.isStaff)
const isSuperuser = computed<boolean>(() => authStore.isSuperuser)
const isAdmin = computed<boolean>(() => authStore.isAdmin)
const isPlanning = computed<boolean>(() => authStore.isPlanning)
const isCustomer = computed<boolean>(() => authStore.isCustomer)
const isBranchEmployee = computed<boolean>(() => authStore.isBranchEmployee)
const isDefaultFamily = computed<boolean>(() => mainStore.getProductFamily === 'default')

// The showMembers (isAdmin) guard around the count call predates the
// collapse and is pinned by the nav-items call-shape spec.
if (authStore.isAdmin) {
  loadRequestedCount()
}

const navLists = {
  branchOrders: BRANCH_ORDER_ROUTES,
  branchPlanning: BRANCH_PLANNING_ROUTES,
  equipmentLocations: locationRoutes('equipment-location'),
  settingsCompany: ['settings-company'],
  settingsImport: SETTINGS_IMPORT_ROUTES,
  settingsUsers: SETTINGS_USER_ROUTES,
  settingsStatuses: SETTINGS_STATUSCODE_ROUTES,
  settingsFilters: SETTINGS_FILTER_ROUTES,
  settingsBranches: SETTINGS_BRANCH_ROUTES,
  settingsMyBranch: ['settings-my-branch'],
  settingsLocations: locationRoutes('settings-location'),
}

const modeClass = computed<string>(() =>
  props.mode === 'branch' ? 'branch' : props.mode === 'settings' ? 'branch-settings' : '')

const getCompanyRouteTo = computed<string>(() =>
  isBranchEmployee.value ? 'employee-dashboard' : 'company-dashboard')

const usersRoute = computed<{ name: string }>(() =>
  isBranchEmployee.value
    ? { name: 'settings-users-employees' }
    : { name: 'settings-users-planningusers' })

const hasOrders = computed<boolean>(() => hasAccessToModule('orders'))
const hasCustomers = computed<boolean>(() => hasAccessToModule('customers'))
const hasInventory = computed<boolean>(() => hasAccessToModule('inventory'))
const hasMobile = computed<boolean>(() => hasAccessToModule('mobile'))
const hasQuotations = computed<boolean>(() => hasAccessToModule('quotations'))
const hasInvoices = computed<boolean>(() => hasAccessToModule('invoices'))
const hasMembers = computed<boolean>(() => isAdmin.value)

const unacceptedCount = computed<number | null>(() => mainStore.unacceptedCount)
const hasBranches = computed<boolean>(() => mainStore.getMemberHasBranches)
const hasBim = computed<boolean>(() => hasAccessToModule('3d') && (isPlanning.value || isAdmin.value))
const hasWebshop = computed<boolean>(() => hasAccessToModule('webshop') && (isPlanning.value || isAdmin.value))

const showCustomers = computed<boolean>(() =>
  !hasBranches.value && (
    (hasCustomers.value && isPlanning.value) ||
    (hasOrders.value && (isPlanning.value || isAdmin.value))
  ))
const showEquipment = computed<boolean>(() => hasBranches.value)
const showInventory = computed<boolean>(() => hasInventory.value && (isPlanning.value || isAdmin.value))
const showMobile = computed<boolean>(() => hasMobile.value && (isPlanning.value || isAdmin.value))
const showCompany = computed<boolean>(() => !isCustomer.value)
const showMembers = computed<boolean>(() => hasMembers.value)
</script>
<style scoped>
.nav-items {
  flex-grow: 1;
}
</style>

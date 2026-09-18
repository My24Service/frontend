<template>
  <div class="nav-items" :class="modeClass" ref="nav-items" v-if="userInfo.user">
    <template v-if="mode === 'default'">
      <!-- Orders -->
      <b-nav-item
        :active="isTopActive('orders')"
        v-if="hasOrders && (isPlanning || isStaff || isSuperuser || isCustomer || isBranchEmployee)"
        to="/orders/orders"
        class="has-children">
        <IBiFileEarmarkTextFill v-if="!isTopActive('orders')"></IBiFileEarmarkTextFill>
        <IBiFileEarmarkText v-else></IBiFileEarmarkText>
        <span style="flex-grow:1">{{ $trans('Orders') }}</span>
        <b-badge
          v-if="unacceptedCount && unacceptedCount > 0"
          variant="light"
          :title="`${unacceptedCount} ${$trans('Unaccepted orders')}`"
        >{{ unacceptedCount }}</b-badge>
        &nbsp;
      </b-nav-item>
      <router-view v-if="isTopActive('orders')" name="app-subnav"></router-view>

      <b-nav-item
        :active="isTopActive('invoices')"
        v-if="hasInvoices && (isPlanning || isStaff || isSuperuser || isCustomer || isBranchEmployee)"
        class="has-children"
        to="/invoices/invoices">
        <IBiReceiptCutoff></IBiReceiptCutoff>
        {{ $trans('Invoices') }}
      </b-nav-item>
      <router-view v-if="isTopActive('invoices')" name="app-subnav"></router-view>

      <!-- equipment -->
      <b-nav-item
        :active="isTopActive('equipment')"
        v-if="showEquipment"
        :to="{ name: 'equipment-equipment-list', params: { type: EQUIPMENT_TYPES.TECHNICAL } }"
        class="has-children">
        <IBiBriefcase v-if="!isTopActive('equipment')"></IBiBriefcase>
        <IBiBriefcaseFill v-if="isTopActive('equipment')"></IBiBriefcaseFill>
        {{ $trans('Equipment') }}
      </b-nav-item>
      <router-view v-if="isTopActive('equipment')" name="app-subnav"></router-view>

      <!-- customers -->
      <b-nav-item
        :active="isTopActive('customers')"
        v-if="showCustomers"
        :to="{name: 'customer-list'}"
        class="has-children">
        <IBiBuilding v-if="!isTopActive('customers')"></IBiBuilding>
        <IBiBuildingFill v-else></IBiBuildingFill>
        {{ $trans('Customers') }}
      </b-nav-item>
      <router-view v-if="isTopActive('customers')" name="app-subnav"></router-view>

      <!-- inventory -->
      <b-nav-item
        :active="isTopActive('inventory')"
        v-if="showInventory"
        to="/inventory/stats-table"
        class="has-children">
        <IBiCollection v-if="!isTopActive('inventory')"></IBiCollection>
        <IBiCollectionFill v-else></IBiCollectionFill>
        {{ $trans('Inventory') }}
      </b-nav-item>
      <router-view v-if="isTopActive('inventory')" name="app-subnav"></router-view>

      <!-- mobile -->
      <b-nav-item
        :active="isTopActive('mobile')"
        v-if="showMobile"
        to="/mobile/dispatch"
        class="has-children">
        <IBiPersonBadge v-if="!isTopActive('mobile')"></IBiPersonBadge>
        <IBiPersonBadgeFill v-else></IBiPersonBadgeFill>
        {{ $trans('Mobile') }}
      </b-nav-item>
      <router-view v-if="isTopActive('mobile')" name="app-subnav"></router-view>

      <b-nav-item
        :active="isTopActive('quotations')"
        v-if="hasQuotations && (isPlanning || isStaff || isSuperuser || isCustomer || isBranchEmployee)"
        class="has-children"
        to="/quotations/quotations">
        <IBiBriefcase v-if="!isTopActive('quotations')"></IBiBriefcase>
        <IBiBriefcaseFill v-else></IBiBriefcaseFill>
        {{ $trans('Quotations') }}
      </b-nav-item>

      <b-nav-item
        :active="isTopActive('company')"
        v-if="showCompany"
        :to="{name: getCompanyRouteTo }"
        class="has-children">
        <IBiBookmarkStar v-if="!isTopActive('company')"></IBiBookmarkStar>
        <IBiBookmarkStarFill v-else></IBiBookmarkStarFill>
        {{ $trans('My company') }}
      </b-nav-item>
      <router-view v-if="isTopActive('company')" name="app-subnav"></router-view>

      <!-- members -->
      <b-nav-item
        :active="isTopActive('members')"
        v-if="showMembers"
        to="/members/members"
        class="has-children">
        <IBiPeople v-if="isTopActive('members')"></IBiPeople>
        <IBiPeopleFill v-else></IBiPeopleFill>
        {{ $trans('Members') }}
        <b-badge v-if="requestedCount > 0" variant="light">{{ requestedCount }}</b-badge>
      </b-nav-item>
      <router-view v-if="isTopActive('members')" name="app-subnav"></router-view>

      <!-- BIM / 3D -->
      <b-nav-item
        v-if="hasBim"
        :to="{name: 'bim-frame'}"
        :active="isTopActive('bim')"
        >
        <IBiMouse2 v-if="!isTopActive('bim')"></IBiMouse2>
        <IBiMouse2Fill v-else></IBiMouse2Fill>
        {{ $trans('3D Module') }}
      </b-nav-item>
      <router-view v-if="isTopActive('bim')" name="app-subnav"></router-view>

      <!-- webshop -->
      <b-nav-item
        v-if="hasWebshop"
        to="/webshop"
        :active="isTopActive('webshop')"
        >
        <IBiBasket v-if="!isTopActive('webshop')"></IBiBasket>
        <IBiBasketFill v-else></IBiBasketFill>
        {{ $trans('Webshop') }}
      </b-nav-item>
      <router-view v-if="isTopActive('webshop')" name="app-subnav"></router-view>
    </template>

    <template v-else-if="mode === 'branch'">
      <b-nav-item v-if="!isDefaultFamily" :to="{name: 'dashboard-overview'}">
        <IBiGridFill v-if="isTopActive('overview')"></IBiGridFill>
        <IBiGrid v-else></IBiGrid>
        {{ $trans('Overview') }}
      </b-nav-item>

      <b-nav-item :to="{name: 'dashboard'}">
        <IBiClockFill v-if="isTopActive('dashboard')"></IBiClockFill>
        <IBiClock v-else></IBiClock>
        {{ $trans('Dashboard') }}
      </b-nav-item>

      <b-nav-item :to="{name: 'order-list'}">
        <IBiClipboard2Fill v-if="isSubActive(navLists.branchOrders)"></IBiClipboard2Fill>
        <IBiClipboard2 v-else></IBiClipboard2>
        {{ $trans('Orders') }}
      </b-nav-item>

      <b-nav-item :to="{name: 'orders-schedule'}">
        <IBiBriefcaseFill v-if="isSubActive(navLists.branchPlanning)"></IBiBriefcaseFill>
        <IBiBriefcase v-else></IBiBriefcase>
        {{ $trans('Planning') }}
      </b-nav-item>

      <b-nav-item
        :to="{name: 'equipment-equipment-list', params: { type: EQUIPMENT_TYPES.TECHNICAL }}"
        :active="isEquipmentTypeActive(EQUIPMENT_TYPES.TECHNICAL)"
      >
        <IBiWrenchAdjustableCircleFill v-if="!isEquipmentTypeActive(EQUIPMENT_TYPES.TECHNICAL)"></IBiWrenchAdjustableCircleFill>
        <IBiWrenchAdjustableCircle v-else></IBiWrenchAdjustableCircle>
        {{ $trans('Technical') }}
      </b-nav-item>

      <b-nav-item
        :to="{name: 'equipment-equipment-list', params: { type: EQUIPMENT_TYPES.FACILITY }}"
        :active="isEquipmentTypeActive(EQUIPMENT_TYPES.FACILITY)"
      >
        <IBiBuildingsFill v-if="!isEquipmentTypeActive(EQUIPMENT_TYPES.FACILITY)"></IBiBuildingsFill>
        <IBiBuildings v-else></IBiBuildings>
        {{ $trans('Facility') }}
      </b-nav-item>

      <b-nav-item :to="{name: 'equipment-location-list'}">
        <IBiGeoAltFill v-if="!isSubActive(navLists.equipmentLocations)"></IBiGeoAltFill>
        <IBiGeoAlt v-else></IBiGeoAlt>
        {{ $trans('Locations') }}
      </b-nav-item>
    </template>

    <template v-else-if="mode === 'settings'">
      <b-nav-item
        v-if="!isBranchEmployee"
        :to="{name: 'settings-company'}"
        :active="isSubActive(navLists.settingsCompany)"
      >
        {{ $trans('Company') }}
      </b-nav-item>

      <b-nav-item
        v-if="!isBranchEmployee"
        :to="{ name: 'settings-company-import-list' }"
        :active="isSubActive(navLists.settingsImport)">
        {{ $trans('Import') }}
      </b-nav-item>

      <b-nav-item
        :to="usersRoute"
        :active="isSubActive(navLists.settingsUsers)"
      >
        {{ $trans('Users') }}
      </b-nav-item>

      <b-nav-item
        v-if="!isBranchEmployee"
        :to="{name: 'settings-order-statuscode-list'}"
        :active="isSubActive(navLists.settingsStatuses)"
      >
        {{ $trans('Statuses') }}
      </b-nav-item>

      <b-nav-item
        v-if="!isBranchEmployee"
        :to="{name: 'settings-order-filter-list'}"
        :active="isSubActive(navLists.settingsFilters)"
      >
        {{ $trans('Filters') }}
      </b-nav-item>

      <b-nav-item
        v-if="!isBranchEmployee"
        :to="{name: 'settings-branches'}"
        :active="isSubActive(navLists.settingsBranches)"
      >
        {{ $trans('Branches') }}
      </b-nav-item>

      <b-nav-item
        v-if="isBranchEmployee"
        :to="{name: 'settings-my-branch'}"
        :active="isSubActive(navLists.settingsMyBranch)"
      >
        {{ $trans('My branch') }}
      </b-nav-item>

      <b-nav-item
        :to="{name: 'settings-equipment-list', params: {type: EQUIPMENT_TYPES.TECHNICAL}}"
        :active="isEquipmentTypeActive(EQUIPMENT_TYPES.TECHNICAL)"
      >
        {{ $trans('Technical') }}
      </b-nav-item>

      <b-nav-item
        :to="{name: 'settings-equipment-list', params: {type: EQUIPMENT_TYPES.FACILITY}}"
        :active="isEquipmentTypeActive(EQUIPMENT_TYPES.FACILITY)"
      >
        {{ $trans('Facility') }}
      </b-nav-item>

      <b-nav-item
        :to="{name: 'settings-location-list'}"
        :active="isSubActive(navLists.settingsLocations)"
      >
        {{ $trans('Locations') }}
      </b-nav-item>
    </template>

  </div>
</template>

<script>
import { EQUIPMENT_TYPES } from '@/constants'
import componentMixin from "@/mixins/common";
import {useMainStore} from "@/stores/main";
import {computed} from "vue";
import {useAuthStore} from "@/features/auth";
import {useNav, useRequestedCount} from "@/components/the_nav/useNav";
import {
  BRANCH_ORDER_ROUTES,
  BRANCH_PLANNING_ROUTES,
  SETTINGS_BRANCH_ROUTES,
  SETTINGS_FILTER_ROUTES,
  SETTINGS_IMPORT_ROUTES,
  SETTINGS_STATUSCODE_ROUTES,
  SETTINGS_USER_ROUTES,
  locationRoutes,
} from "@/components/navSections";

// One sidebar menu for the three shells TheSidebar switches between:
// mode "default", "branch" and "settings". Guards, links, badges and outlets are unchanged per
// mode; the setup/stores/requestedCount fetch that was copied across all three
// files now lives here once, via useNav()/useRequestedCount().
export default {
  name: "NavItems",
  mixins: [componentMixin],
  props: {
    mode: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'branch', 'settings'].includes(value),
    },
  },
  setup() {
    const mainStore = useMainStore()
    const authStore = useAuthStore()
    const userInfo = computed(() => authStore.userInfo);
    const {isTopActive, isSubActive, isEquipmentTypeActive} = useNav()
    const {requestedCount, loadRequestedCount} = useRequestedCount()

    // The showMembers (isAdmin) guard around the count call predates the
    // collapse and is pinned by the nav-items call-shape spec.
    if (authStore.isAdmin) {
      loadRequestedCount()
    }

    return {
      mainStore,
      userInfo,
      requestedCount,
      isTopActive,
      isSubActive,
      isEquipmentTypeActive,
      navLists: {
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
      },
    }
  },
  data() {
    return {
      EQUIPMENT_TYPES,
    }
  },
  computed: {
    modeClass() {
      return this.mode === 'branch' ? 'branch' : this.mode === 'settings' ? 'branch-settings' : ''
    },
    getCompanyRouteTo() {
      if (this.isBranchEmployee) {
        return 'employee-dashboard'
      }

      return 'company-dashboard'
    },
    usersRoute() {
      // A branch employee only manages the employee users of their own branch.
      return this.isBranchEmployee
        ? {name: 'settings-users-employees'}
        : {name: 'settings-users-planningusers'}
    },
    showCustomers() {
      return !this.hasBranches && (
        (this.hasCustomers && this.isPlanning) ||
        this.hasOrders && (this.isPlanning || this.isAdmin)
      );
    },
    showEquipment() {
      return this.hasBranches;
    },
    showInventory() {
      return this.hasInventory && (this.isPlanning || this.isAdmin);
    },
    showMobile() {
      return this.hasMobile && (this.isPlanning || this.isAdmin)
    },
    showCompany() {
      return !this.isCustomer;
    },
    showMembers() {
      return this.hasMembers;
    },
    hasOrders() {
      return this.hasAccessToModule('orders')
    },
    hasCustomers() {
      return this.hasAccessToModule('customers')
    },
    hasInventory() {
      return this.hasAccessToModule('inventory')
    },
    hasMobile() {
      return this.hasAccessToModule('mobile')
    },
    hasQuotations() {
      return this.hasAccessToModule('quotations')
    },
    hasInvoices() {
      return this.hasAccessToModule('invoices')
    },
    hasMembers() {
      return this.isAdmin
    },
    unacceptedCount() {
      return this.mainStore.unacceptedCount
    },
    hasBranches() {
      return this.mainStore.getMemberHasBranches
    },
    hasBim() {
      return this.hasAccessToModule('3d') && (this.isPlanning || this.isAdmin)
    },
    hasWebshop() {
      return this.hasAccessToModule('webshop') && (this.isPlanning || this.isAdmin)
    }
  },
}
</script>
<style scoped>
.nav-items {
  flex-grow: 1;
}
</style>

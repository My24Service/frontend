<template>
  <div class="nav-items" ref="nav-items">
    <!-- Orders -->
    <b-nav-item
      :active="isActive('orders')"
      v-if="hasOrders && (isPlanning || isStaff || isSuperuser || isCustomer || isBranchEmployee)"
      to="/orders/orders"
      class="has-children">
      <IBiFileEarmarkText v-if="!isActive('orders')"></IBiFileEarmarkText>
      <IBiFileEarmarkTextFill v-else></IBiFileEarmarkTextFill>
      <span style="flex-grow:1">{{ $trans('Orders') }}</span>
      <b-badge
        v-if="unacceptedCount && unacceptedCount > 0"
        variant="secondary"
        :title="`${unacceptedCount} ${$trans('Unaccepted orders')}`">{{ unacceptedCount }}</b-badge>
        &nbsp;
    </b-nav-item>

    <!-- Orders submenu -->
    <div class="page-subnav" v-if="isActive('orders')">
      <b-nav>
        <b-nav-item
          v-if="isActive('orders')"
          :active="isActive('orders','statuscodes')"
          to="/orders/statuscodes">
          {{ $trans('Statuscodes') }}
        </b-nav-item>
        <b-nav-item
          v-if="isActive('orders')"
          :active="isActive('orders','year-stats') || isActive('orders','month-stats')"
          to="/orders/year-stats">
          {{ $trans('Stats') }}
        </b-nav-item>
        <b-nav-item
          :active="isActive('orders', 'filter')"
          v-if="isStaff || isSuperuser || isPlanning"
          :to="{ name: 'order-filter-list' }">
          {{ $trans('Filters') }}
        </b-nav-item>
      </b-nav>
    </div>

    <b-nav-item
      :active="isActive('invoices')"
      v-if="hasInvoices && (isPlanning || isStaff || isSuperuser || isCustomer || isBranchEmployee)"
      class="has-children"
      to="/invoices/invoices">
      <IBiReceiptCutoff></IBiReceiptCutoff>
      {{ $trans('Invoices') }}
    </b-nav-item>
    <SubNav v-if="isActive('invoices') || isActive('invoices', 'invoices')">
      <router-view name="app-subnav"></router-view>
    </SubNav>

    <!-- equipment -->
    <b-nav-item
      :active="isActive('equipment')"
      v-if="showEquipment"
      to="/equipment/equipment"
      class="has-children">
      <IBiBriefcase v-if="!isActive('equipment')"></IBiBriefcase>
      <IBiBriefcaseFill v-if="isActive('equipment')"></IBiBriefcaseFill>
      {{ $trans('Equipment') }}
    </b-nav-item>
    <SubNav v-if="isActive('equipment')">
      <router-view name="app-subnav"></router-view>
    </SubNav>

    <!-- dashboard for branch employees -->
    <b-nav-item
      :active="isActive('company')"
      v-if="showBranchEmployeeDashBoard"
      to="/company/employee-dashboard"
      class="has-children">
      <IBiCalendar2Range></IBiCalendar2Range> {{ $trans('Dashboard') }}
    </b-nav-item>
    <SubNav v-if="showBranchEmployeeDashBoard && isActive('company')">
      <router-view name="app-subnav"></router-view>
    </SubNav>

    <!-- customers -->
    <b-nav-item
      :active="isActive('customers')"
      v-if="showCustomers"
      to="/customers/customers"
      class="has-children">
      <IBiBuilding v-if="!isActive('customers')"></IBiBuilding>
      <IBiBuildingFill v-else></IBiBuildingFill>
      {{ $trans('Customers') }}
    </b-nav-item>
    <SubNav v-if="isActive('customers')">
      <router-view name="app-subnav"></router-view>
    </SubNav>

    <!-- inventory -->
    <b-nav-item
      :active="isActive('inventory')"
      v-if="showInventory"
      to="/inventory/stats-table"
      class="has-children">
      <IBiCollection v-if="!isActive('inventory')"></IBiCollection>
      <IBiCollectionFill v-else></IBiCollectionFill>
      {{ $trans('Inventory') }}
    </b-nav-item>
    <SubNav v-if="isActive('inventory')">
      <router-view name="app-subnav"></router-view>
    </SubNav>

    <!-- mobile -->
    <b-nav-item
      :active="isActive('mobile')"
      v-if="showMobile"
      to="/mobile/dispatch"
      class="has-children">
      <IBiPersonBadge v-if="!isActive('mobile')"></IBiPersonBadge>
      <IBiPersonBadgeFill v-else></IBiPersonBadgeFill>
      {{ $trans('Mobile') }}
    </b-nav-item>
    <SubNav v-if="isActive('mobile')">
      <router-view name="app-subnav"></router-view>
    </SubNav>

    <b-nav-item
      :active="isActive('quotations')"
      v-if="hasQuotations && (isPlanning || isStaff || isSuperuser || isCustomer || isBranchEmployee)"
      class="has-children"
      to="/quotations/quotations">
      <IBiBriefcase v-if="!isActive('quotations')"></IBiBriefcase>
      <IBiBriefcaseFill v-else></IBiBriefcaseFill>
      {{ $trans('Quotations') }}
    </b-nav-item>

    <b-nav-item
      :active="isActive('company')"
      v-if="showCompany"
      to="/company/dashboard"
      class="has-children">
      <IBiBookmarkStar v-if="!isActive('company')"></IBiBookmarkStar>
      <IBiBookmarkStarFill v-else></IBiBookmarkStarFill>
      {{ $trans('My company') }}
    </b-nav-item>
    <SubNav v-if="isActive('company') || isActive('company', 'budgets')">
      <router-view name="app-subnav"></router-view>
    </SubNav>

    <!-- members -->
    <b-nav-item
      :active="isActive('members')"
      v-if="showMembers"
      to="/members/members"
      class="has-children">
      <IBiPeople v-if="isActive('members')"></IBiPeople>
      <IBiPeopleFill v-else></IBiPeopleFill>
      {{ $trans('Members') }}
      <b-badge v-if="requestedCount > 0" variant="light">{{ requestedCount }}</b-badge>
    </b-nav-item>
    <SubNav v-if="isActive('members')">
      <router-view name="app-subnav"></router-view>
    </SubNav>

    <!-- budgets
    <b-nav-item
      v-if="isPlanning"
      to="/budget"
      :active="isActive('budget')"
      >
      <b-icon icon="credit-card2-front" v-if="!isActive('budget')"></b-icon>
      <b-icon icon="credit-card2-front-fill" v-if="isActive('budget')"></b-icon>
      {{ $trans('Budgets') }}
    </b-nav-item>
    <SubNav v-if="isActive('budget')">
      <router-view name="app-subnav"></router-view>
    </SubNav>
    -->

    <!-- BIM / 3D -->
    <b-nav-item
      v-if="hasBim"
      :to="{name: 'bim-frame'}"
      :active="isActive('bim')"
      >
      <IBiMouse2 v-if="!isActive('bim')"></IBiMouse2>
      <IBiMouse2Fill v-else></IBiMouse2Fill>
      {{ $trans('3D Module') }}
    </b-nav-item>
    <SubNav v-if="isActive('bim')">
      <router-view name="app-subnav"></router-view>
    </SubNav>

    <!-- webshop -->
    <b-nav-item
      v-if="hasWebshop"
      to="/webshop"
      :active="isActive('webshop')"
      >
      <IBiBasket v-if="!isActive('webshop')"></IBiBasket>
      <IBiBasketFill v-else></IBiBasketFill>
      {{ $trans('Webshop') }}
    </b-nav-item>
    <SubNav v-if="isActive('webshop')">
      <router-view name="app-subnav"></router-view>
    </SubNav>

  </div>
</template>

<script>

import SubNav from '@/components/SubNav';
import SubNavCustomers from '@/components/SubNavCustomers';
import SubNavInventory from '@/components/SubNavInventory';
import {MemberService} from "@/models/member/Member";

export default {

  data() {
    return {
      memberService: new MemberService(),
      requestedCount: null
    }
  },
  methods: {
    isActive(item, subsection) {
      const parts = this.$route.path.split('/')
      if(!subsection) {
        return parts[1] === item
      } else {
        return parts[parts.length] === item
      }
    }
  },
  async created() {
    if (this.showMembers) {
      const result = await this.memberService.getRequestedCount()
      this.requestedCount = result.count
    }
  },
  computed: {
    showCustomerDashBoard() {
      return !this.hasBranches && this.isCustomer
    },
    showBranchEmployeeDashBoard() {
      return this.hasBranches && this.isBranchEmployee
    },
    showCustomers() {
      return !this.hasBranches && (
        (this.hasCustomers && this.$store.getters.getIsPlanning) ||
        this.hasOrders && (this.$store.getters.getIsPlanning || this.$store.getters.getIsStaff || this.$store.getters.getIsSuperuser)
      );
    },
    showEquipment() {
      return this.hasBranches;
    },
    showInventory() {
      return this.hasInventory && (this.$store.getters.getIsPlanning || this.$store.getters.getIsStaff || this.$store.getters.getIsSuperuser);
    },
    showMobile() {
      return this.hasMobile && (this.$store.getters.getIsPlanning || this.$store.getters.getIsStaff || this.$store.getters.getIsSuperuser)
    },
    showCompany() {
      return !this.isCustomer && !this.isEmployee;
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
    hasCompany() {
      return this.hasAccessToModule('company')
    },
    hasMembers() {
      return this.$store.getters.getIsStaff || this.$store.getters.getIsSuperuser
    },
    unacceptedCount() {
      return this.$store.state.unacceptedCount
    },
    hasBranches() {
      return this.$store.getters.getMemberHasBranches
    },
    hasBim() {
      return this.hasAccessToModule('3d') && (this.$store.getters.getIsPlanning || this.$store.getters.getIsStaff || this.$store.getters.getIsSuperuser)
    },
    hasWebshop() {
      return this.hasAccessToModule('webshop') && (this.$store.getters.getIsPlanning || this.$store.getters.getIsStaff || this.$store.getters.getIsSuperuser)
    }
  },
  watch: {
    unacceptedCount (oldValue, newValue) {
    }
  },
  components: {
    SubNav,
    SubNavCustomers,
    SubNavInventory
  }
}
</script>

<style scoped>
.nav-items {
  flex-grow: 1;
}
</style>

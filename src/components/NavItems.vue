<template>
  <div class="nav-items" ref="nav-items">
    <!-- Orders -->
    <b-nav-item
      :active="isActive('orders')"
      v-if="hasOrders && (isPlanning || isStaff || isSuperuser || isCustomer || isBranchEmployee)"
      to="/orders/orders"
      class="has-children">
      <b-icon icon="file-earmark-text" v-if="!isActive('orders')"></b-icon>
      <b-icon icon="file-earmark-text-fill" v-else></b-icon>
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
      <b-icon icon="receipt-cutoff"></b-icon>
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
      <b-icon icon="briefcase" v-if="!isActive('equipment')"></b-icon>
      <b-icon icon="briefcase-fill" v-if="isActive('equipment')"></b-icon>
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
      <b-icon></b-icon> {{ $trans('Dashboard') }}
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
      <b-icon icon="building"></b-icon>
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
      <b-icon icon="collection" v-if="!isActive('inventory')"></b-icon>
      <b-icon icon="collection-fill" v-else></b-icon>
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
      <b-icon icon="person-badge" v-if="!isActive('mobile')"></b-icon>
      <b-icon icon="person-badge-fill" v-else></b-icon>
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
      <b-icon icon="briefcase" v-if="!isActive('quotations')"></b-icon>
      <b-icon icon="briefcase-fill" v-else></b-icon>
      {{ $trans('Quotations') }}
    </b-nav-item>

    <b-nav-item
      :active="isActive('company')"
      v-if="showCompany"
      to="/company/dashboard"
      class="has-children">
      <b-icon icon="bookmark-star" v-if="!isActive('company')"></b-icon>
      <b-icon icon="bookmark-star-fill" v-if="isActive('company')"></b-icon>
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
      <b-icon icon="people"></b-icon> {{ $trans('Members') }}
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
      <b-icon icon="mouse2" v-if="!isActive('bim')"></b-icon>
      <b-icon icon="mouse2-fill" v-if="isActive('bim')"></b-icon>
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
      <b-icon icon="basket" v-if="!isActive('webshop')"></b-icon>
      <b-icon icon="basket-fill" v-if="isActive('webshop')"></b-icon>
      {{ $trans('Webshop') }}
    </b-nav-item>
    <SubNav v-if="isActive('webshop')">
      <router-view name="app-subnav"></router-view>
    </SubNav>

  </div>
</template>

<script>
import { componentMixin } from '../utils.js'
import SubNav from '@/components/SubNav';
import SubNavCustomers from '@/components/SubNavCustomers';
import SubNavInventory from '@/components/SubNavInventory';
import {MemberService} from "@/models/member/Member";

export default {
  mixins: [componentMixin],
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
        (this.hasCustomers && this.isPlanning) ||
        this.hasOrders && (this.isPlanning || this.isStaff || this.isSuperuser)
      );
    },
    showEquipment() {
      return this.hasBranches;
    },
    showInventory() {
      return this.hasInventory && (this.isPlanning || this.isStaff || this.isSuperuser);
    },
    showMobile() {
      return this.hasMobile && (this.isPlanning || this.isStaff || this.isSuperuser)
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
      return this.isStaff || this.isSuperuser
    },
    unacceptedCount() {
      return this.$store.state.unacceptedCount
    },
    hasBranches() {
      return this.$store.getters.getMemberHasBranches
    },
    hasBim() {
      return this.hasAccessToModule('3d') && (this.isPlanning || this.isStaff || this.isSuperuser)
    },
    hasWebshop() {
      return this.hasAccessToModule('webshop') && (this.isPlanning || this.isStaff || this.isSuperuser)
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

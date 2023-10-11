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
      {{ $trans('Orders') }}
      <b-badge 
        v-if="unacceptedCount && unacceptedCount > 0" 
        variant="light"
        :title="`${unacceptedCount} ${$trans('Unaccepted orders')}`">{{ unacceptedCount }}</b-badge>
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
      </b-nav>
    </div>
 
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
      to="/inventory/purchaseorders"
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

    <!-- company -->
<!--       <b-nav-item :active="isActive('quotations')" v-if="hasQuotations" to="/quotations/quotations">{{ $trans('Quotations') }}</b-nav-item>
      <div class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
 -->

    <b-nav-item
      :active="isActive('company')"
      v-if="showCompany"
      to="/company/dashboard"
      class="has-children">
      <b-icon icon="bookmark-star" v-if="!isActive('company')"></b-icon>
      <b-icon icon="bookmark-star-fill" v-if="isActive('company')"></b-icon>
      {{ $trans('My company') }}
    </b-nav-item>
    <SubNav v-if="isActive('company')">
      <router-view name="app-subnav"></router-view>
    </SubNav>
    
    <!-- members -->
    <b-nav-item
      :active="isActive('members')"
      v-if="showMembers"
      to="/members/members"
      class="has-children">
      <b-icon icon="people"></b-icon> {{ $trans('Members') }}
    </b-nav-item>
    <SubNav v-if="isActive('members')">
      <router-view name="app-subnav"></router-view>
    </SubNav>

    <!-- budgets -->
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

    <!-- docks -->
    <b-nav-item
      v-if="isPlanning"
      :to="{name: 'docks-mockup'}"
      :active="isActive('docks')"
      >
      <b-icon icon="truck-flatbed" v-if="!isActive('docks')"></b-icon>
      <b-icon icon="truck" v-if="isActive('docks')"></b-icon>
      {{ $trans('Docks') }}
    </b-nav-item>
    <SubNav v-if="isActive('docks')">
      <router-view name="app-subnav"></router-view>
    </SubNav>

    <!-- BIM / 3D -->
    <b-nav-item
      v-if="isPlanning"
      :to="{name: 'bim-frame'}"
      :active="isActive('bim')"
      >
      <b-icon icon="mouse2" v-if="!isActive('bim')"></b-icon>
      <b-icon icon="mouse2-fill" v-if="isActive('bim')"></b-icon>
      {{ $trans('BIM / 3D') }}
    </b-nav-item>
    <SubNav v-if="isActive('bim')">
      <router-view name="app-subnav"></router-view>
    </SubNav>

    <!-- webshop -->
    <b-nav-item
      v-if="isPlanning"
      :to="{name:'webshop'}"
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

export default {
  mixins: [componentMixin],
  data() {
    return {
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

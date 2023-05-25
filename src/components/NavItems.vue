<template>
  <span>
    <b-navbar-nav ref="nav-items">
      <b-nav-item
        :active="isActive('orders')"
        v-if="hasOrders && (isPlanning || isStaff || isSuperuser || isCustomer || isBranchEmployee)"
        to="/orders/orders">{{ $trans('Orders') }}
        <b-badge v-if="unacceptedCount && unacceptedCount > 0" variant="light">{{ unacceptedCount }}</b-badge>
      </b-nav-item>

      <!-- dashboard for customer users -->
      <div
        v-if="showCustomerDashBoard"
        class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
      <b-nav-item
        :active="isActive('customers')"
        v-if="showCustomerDashBoard"
        to="/customers/dashboard">{{ $trans('Dashboard') }}
      </b-nav-item>

      <!-- equipment -->
      <div
        v-if="showEquipment"
        class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
      <b-nav-item
        :active="isActive('equipment')"
        v-if="showEquipment"
        to="/equipment/equipment">{{ $trans('Equipment') }}
      </b-nav-item>

      <!-- dashboard for branch employees -->
      <div
        v-if="showBranchEmployeeDashBoard"
        class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
      <b-nav-item
        :active="isActive('company')"
        v-if="showBranchEmployeeDashBoard"
        to="/company/employee-dashboard">{{ $trans('Dashboard') }}
      </b-nav-item>

      <!-- customers -->
      <div
        v-if="showCustomers"
        class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
      <b-nav-item
        :active="isActive('customers')"
        v-if="showCustomers"
        to="/customers/customers">{{ $trans('Customers') }}
      </b-nav-item>

      <!-- inventory -->
      <div
        v-if="showInventory"
        class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
      <b-nav-item
        :active="isActive('inventory')"
        v-if="showInventory"
        to="/inventory/purchaseorders">{{ $trans('Inventory') }}
      </b-nav-item>

      <!-- mobile -->
      <div
        v-if="showMobile"
        class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
      <b-nav-item
        :active="isActive('mobile')"
        v-if="showMobile"
        to="/mobile/dispatch">{{ $trans('Mobile') }}
      </b-nav-item>

      <!-- company -->
      <div
        v-if="showCompany"
        class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
<!--       <b-nav-item :active="isActive('quotations')" v-if="hasQuotations" to="/quotations/quotations">{{ $trans('Quotations') }}</b-nav-item>
      <div class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
 -->

      <b-nav-item
        :active="isActive('company')"
        v-if="showCompany"
        to="/company/dashboard">{{ $trans('Company') }}
      </b-nav-item>
      <div v-if="hasMembers" class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>

      <!-- members -->
      <b-nav-item
        :active="isActive('members')"
        v-if="showMembers"
        to="/members/members">{{ $trans('Members') }}
      </b-nav-item>
    </b-navbar-nav>
  </span>
</template>

<script>
import { componentMixin } from '../utils.js'

export default {
  mixins: [componentMixin],
  data() {
    return {
    }
  },
  methods: {
    isActive(item) {
      const parts = this.$route.path.split('/')
      return parts[1] === item
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
}
</script>

<style scoped>
</style>

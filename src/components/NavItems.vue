<template>
  <span>
    <b-navbar-nav ref="nav-items">
      <b-nav-item
        :active="isActive('orders')"
        v-if="isStaff || isSuperuser || (hasOrders && (isPlanning || isCustomer))"
        to="/orders/orders">{{ $trans('Orders') }}
        <b-badge v-if="unacceptedCount && unacceptedCount > 0" variant="light">{{ unacceptedCount }}</b-badge>
      </b-nav-item>
      <div
        v-if="isStaff || isSuperuser || (hasCustomers && isPlanning)"
        class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
      <b-nav-item
        :active="isActive('customers')"
        v-if="isStaff || isSuperuser || (hasCustomers && isPlanning)"
        to="/customers/customers">{{ $trans('Customers') }}
      </b-nav-item>
      <div
        v-if="isStaff || isSuperuser || (hasInventory && isPlanning)"
        class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
      <b-nav-item
        :active="isActive('inventory')"
        v-if="isStaff || isSuperuser || (hasInventory && isPlanning)"
        to="/inventory/purchaseorders">{{ $trans('Inventory') }}
      </b-nav-item>
      <div
        v-if="isStaff || isSuperuser || (hasMobile && isPlanning)"
        class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
      <b-nav-item
        :active="isActive('mobile')"
        v-if="isStaff || isSuperuser || (hasMobile && isPlanning)"
        to="/mobile/dispatch">{{ $trans('Mobile') }}
      </b-nav-item>
      <div
        v-if="isStaff || isSuperuser || (hasCompany && isPlanning)"
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
        v-if="isStaff || isSuperuser || (hasCompany && isPlanning)"
        to="/company/dashboard">{{ $trans('Company') }}
      </b-nav-item>
      <div v-if="hasMembers" class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
      <b-nav-item :active="isActive('members')" v-if="hasMembers" to="/members/members">{{ $trans('Members') }}</b-nav-item>
    </b-navbar-nav>
  </span>
</template>

<script>
import { componentMixin } from '@/utils.js'

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
      return this.isStaff && this.isSuperuser
    },
    unacceptedCount() {
      return this.$store.state.unacceptedCount
    }
  },
  watch: {
    unacceptedCount (oldValue, newValue) {
    }
  },
}
</script>

<style scoped>
</style>

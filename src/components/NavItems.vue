<template>
  <span>
    <b-navbar-nav v-if="isLoaded" ref="nav-items">
      <b-nav-item :active="isActive('orders')" v-if="hasOrders" to="/orders/orders">{{ $trans('Orders') }}</b-nav-item>
      <div class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
      <b-nav-item :active="isActive('customers')" v-if="hasCustomers" to="/customers/customers">{{ $trans('Customers') }}</b-nav-item>
      <div class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
      <b-nav-item :active="isActive('inventory')" v-if="hasInventory" to="/inventory/purchaseorders">{{ $trans('Inventory') }}</b-nav-item>
      <div class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
      <b-nav-item :active="isActive('mobile')" v-if="hasMobile" to="/mobile/dispatch">{{ $trans('Mobile') }}</b-nav-item>
      <div class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
<!--       <b-nav-item :active="isActive('quotations')" v-if="hasQuotations" to="/quotations/quotations">{{ $trans('Quotations') }}</b-nav-item>
      <div class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
 -->      <b-nav-item :active="isActive('company')" v-if="hasCompany" to="/company/dashboard">{{ $trans('Company') }}</b-nav-item>
      <div v-if="hasMembers" class="main-nav-divider">
        &nbsp;|&nbsp;
      </div>
      <b-nav-item :active="isActive('members')" v-if="hasMembers" to="/members/members">{{ $trans('Members') }}</b-nav-item>
    </b-navbar-nav>
  </span>
</template>

<script>
import { componentMixin } from '@/utils'

export default {
  mixins: [componentMixin],
  data() {
    return {
      isStaff: false,
      isSuperuser: false,
      isLoaded: false
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
    }
  },
  created() {
    // get user types
    this.$store.dispatch('getIsStaff').then((isStaff) => {
      this.isStaff = isStaff

      this.$store.dispatch('getIsSuperuser').then((isSuperuser) => {
        this.isSuperuser = isSuperuser

        this.isLoaded = true
      })
    })
  },
}
</script>

<style scoped>
</style>

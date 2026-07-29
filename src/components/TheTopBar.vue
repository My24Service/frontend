<template>
  <header class="app-topbar">
    <h1 class="app-topbar-title">{{ pageTitle }}</h1>

    <div class="app-topbar-actions">
      <router-link
        :to="{name: 'order-list'}"
        class="app-topbar-bell"
        :title="bellTitle"
      >
        <IBiBell></IBiBell>
        <span v-if="unacceptedCount > 0" class="app-topbar-bell-dot"></span>
      </router-link>
    </div>
  </header>
</template>

<script>
import componentMixin from "@/mixins/common";
import {useMainStore} from "@/stores/main";

// Section titles for the top bar. Keyed by the leading segment of the route
// name, so `orders-list`, `orders-view` etc. all resolve to one title.
const SECTION_TITLES = {
  dashboard: 'Dashboard',
  order: 'Orders',
  orders: 'Orders',
  assignedorder: 'Orders',
  workorder: 'Work order',
  purchaseorder: 'Purchase orders',
  preliminary: 'Orders',
  unconfirmed: 'Orders',
  quotation: 'Quotations',
  quotations: 'Quotations',
  invoice: 'Invoices',
  invoices: 'Invoices',
  equipment: 'Equipment',
  customer: 'Customers',
  customers: 'Customers',
  inventory: 'Inventory',
  material: 'Materials',
  mutation: 'Mutations',
  stock: 'Stock',
  supplier: 'Suppliers',
  purchase: 'Purchase',
  company: 'Company',
  employee: 'Employees',
  engineer: 'Engineers',
  member: 'Member',
  module: 'Modules',
  contract: 'Contracts',
  partner: 'Partners',
  budget: 'Budget',
  leave: 'Leave',
  sick: 'Sick leave',
  trip: 'Trips',
  maintenance: 'Maintenance',
  planning: 'Planning',
  mobile: 'Planning',
  docks: 'Docks',
  bim: 'BIM',
  webshop: 'Shop',
  settings: 'Settings',
}

export default {
  name: 'TheTopBar',
  mixins: [componentMixin],
  computed: {
    unacceptedCount() {
      return useMainStore().unacceptedCount || 0
    },
    bellTitle() {
      return `${this.unacceptedCount} ${this.$trans('Unaccepted orders')}`
    },
    pageTitle() {
      const name = this.$route.name || ''
      const section = String(name).split('-')[0]
      const title = SECTION_TITLES[section]
      return title ? this.$trans(title) : ''
    }
  }
}
</script>

import componentMixin from "@/mixins/common"
import my24 from "@/services/my24"
import {OrderService} from "@/models/orders/Order"
import {CustomerService} from "@/models/customer/Customer"
import {MaterialService} from "@/models/inventory/Material"
import {useMainStore} from "@/stores/main"

const RECENT_ORDERS_SHOWN = 5

// Data loading for the overview dashboard (the mockup's landing page).
//
// Note: mainStore is a computed rather than a setup() return, because Vue 3
// does not merge setup() from mixins — same as dashboardMixin.
export default {
  mixins: [componentMixin],
  computed: {
    mainStore() {
      return useMainStore()
    },
    statuscodes() {
      return this.mainStore.getStatuscodes
    },
    // Free — the websocket/poller in Notification.vue keeps this current.
    unacceptedCount() {
      return this.mainStore.unacceptedCount || 0
    },
    greeting() {
      const hour = new Date().getHours()
      if (hour < 12) return this.$trans('Good morning')
      if (hour < 18) return this.$trans('Good afternoon')
      return this.$trans('Good evening')
    },
    // Same access rules the sidebar uses, so a quick link never points at a
    // module this user cannot open.
    canSeeCustomers() {
      return this.hasAccessToModule('customers') && (this.isPlanning || this.isAdmin)
    },
    canSeeInventory() {
      return this.hasAccessToModule('inventory') && (this.isPlanning || this.isAdmin)
    },
    kpis() {
      return [
        {
          key: 'orders',
          icon: 'clipboard-check',
          iconClass: 'tw:text-teal-600',
          label: this.$trans('Orders'),
          value: this.orderCount,
          to: {name: 'order-list'},
        },
        {
          key: 'unaccepted',
          icon: 'exclamation-circle',
          iconClass: 'tw:text-amber-600',
          label: this.$trans('Unaccepted orders'),
          value: this.unacceptedCount,
          hint: this.unacceptedCount > 0
            ? this.$trans('Needs acceptance')
            : this.$trans('All accepted'),
          to: {name: 'orders-not-accepted'},
        },
        {
          key: 'customers',
          icon: 'people',
          iconClass: 'tw:text-sky-600',
          label: this.$trans('Customers'),
          value: this.customerCount,
          to: this.canSeeCustomers ? {name: 'customer-list'} : null,
        },
        {
          key: 'materials',
          icon: 'bag',
          iconClass: 'tw:text-emerald-600',
          label: this.$trans('Materials'),
          value: this.materialCount,
          to: this.canSeeInventory ? {name: 'material-list'} : null,
        },
      ]
    }
  },
  data() {
    return {
      orderService: new OrderService(),
      customerService: new CustomerService(),
      materialService: new MaterialService(),
      recentOrders: [],
      // null means "not loaded yet" so the template can tell that apart from 0
      orderCount: null,
      customerCount: null,
      materialCount: null,
      isLoading: false,
    }
  },
  async created() {
    await this.loadData()
  },
  methods: {
    statusColor(status) {
      return my24.status2color(this.statuscodes, status)
    },
    // The mockup's status pills are a `bg-x-50 / border-x-200 / text-x-700`
    // triple. The statuscode's own colour is the only real input we have, so
    // approximate those three shades from it — mixing towards white for the
    // background and border and towards black for the text, which keeps pale
    // statuscodes (and the #ccc fallback) readable.
    statusPillStyle(status) {
      const color = this.statusColor(status)
      return {
        color: `color-mix(in srgb, ${color} 70%, black)`,
        borderColor: `color-mix(in srgb, ${color} 40%, white)`,
        backgroundColor: `color-mix(in srgb, ${color} 12%, white)`,
      }
    },
    async loadData() {
      this.isLoading = true

      // One request serves both the orders KPI and the recent-orders table.
      this.orderService.queryMode = 'all'
      this.orderService.currentPage = 1

      const results = await Promise.allSettled([
        this.orderService.list(),
        this.canSeeCustomers ? this.customerService.list() : Promise.resolve(null),
        this.canSeeInventory ? this.materialService.list() : Promise.resolve(null),
      ])

      const [orders, customers, materials] = results

      if (orders.status === 'fulfilled') {
        this.orderCount = orders.value.count
        this.recentOrders = (orders.value.results || []).slice(0, RECENT_ORDERS_SHOWN)
      } else {
        console.error('error getting orders for the overview', orders.reason)
      }

      if (customers.status === 'fulfilled' && customers.value) {
        this.customerCount = customers.value.count
      } else if (customers.status === 'rejected') {
        console.error('error getting customers for the overview', customers.reason)
      }

      if (materials.status === 'fulfilled' && materials.value) {
        this.materialCount = materials.value.count
      } else if (materials.status === 'rejected') {
        console.error('error getting materials for the overview', materials.reason)
      }

      this.isLoading = false
    }
  },
}

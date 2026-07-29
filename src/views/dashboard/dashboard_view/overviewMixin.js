import componentMixin from "@/mixins/common"
import my24 from "@/services/my24"
import {OrderService} from "@/models/orders/Order"
import dashboardStatsModel from "@/models/company/DashboardStats"
import {useMainStore} from "@/stores/main"

const RECENT_ORDERS_SHOWN = 5

// Placeholder until Material grows a real per-material minimum_stock field.
// The backend takes the threshold as a query parameter precisely so this can
// move without an API change.
const LOW_STOCK_THRESHOLD = 5

// Data loading for the overview dashboard (the mockup's landing page).
//
// The KPI tiles come from one call to /member/member/overview_stats/, which
// returns only the widgets we ask for. The orders call stays because the
// recent-orders table actually uses the rows it returns.
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
    // Totals behind the quick links: "N in total" / "N in stock". These are
    // plain counts, deliberately not the same thing as the active-customers
    // and low-stock tiles above them.
    customerCount() {
      return this.widgetValue('total_customers')
    },
    materialCount() {
      return this.widgetValue('total_materials')
    },
    kpis() {
      const lowStock = this.widgetValue('low_stock')

      return [
        {
          key: 'open_orders',
          icon: 'clipboard-check',
          iconClass: 'tw:text-teal-600',
          label: this.$trans('Open orders'),
          value: this.widgetValue('open_orders'),
          hint: this.deltaHint('open_orders'),
          to: {name: 'order-list'},
        },
        {
          key: 'active_customers',
          icon: 'people',
          iconClass: 'tw:text-sky-600',
          label: this.$trans('Active customers'),
          value: this.widgetValue('active_customers'),
          hint: this.deltaHint('active_customers'),
          to: this.canSeeCustomers ? {name: 'customer-list'} : null,
        },
        {
          key: 'orders_this_week',
          icon: 'bag',
          iconClass: 'tw:text-emerald-600',
          label: this.$trans('Orders this week'),
          value: this.widgetValue('orders_this_week'),
          hint: this.deltaHint('orders_this_week'),
          to: {name: 'order-list'},
        },
        {
          key: 'low_stock',
          icon: 'exclamation-circle',
          iconClass: 'tw:text-amber-600',
          label: this.$trans('Low stock'),
          value: lowStock,
          // a level rather than a movement, so it carries advice, not a delta
          hint: lowStock > 0
            ? this.$trans('Order in time')
            : this.$trans('Stock levels fine'),
          to: this.canSeeInventory ? {name: 'material-list'} : null,
        },
      ]
    }
  },
  data() {
    return {
      orderService: new OrderService(),
      recentOrders: [],
      // widget name -> {value, delta, delta_type, delta_period}. Empty until
      // loaded, so widgetValue returns null and the tiles render a dash.
      stats: {},
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
    // null (rather than 0) means "no number to show" — not loaded yet, not
    // requested, or the widget failed server-side. The template renders a dash.
    widgetValue(name) {
      const widget = this.stats[name]
      if (!widget || widget.value === null || widget.value === undefined) {
        return null
      }

      return widget.value
    },
    // Turns a widget's delta into the sub-line under the number: "+3 this
    // week", "+18%".
    deltaHint(name) {
      const widget = this.stats[name]
      if (!widget) {
        return ''
      }

      const hasDelta = widget.delta !== null && widget.delta !== undefined

      // A percentage tile always shows its line, so the row of tiles keeps an
      // even height. The backend sends null when there's no basis for a
      // comparison (nothing at all in the previous period); shown as 0%.
      if (widget.delta_type === 'perc') {
        const delta = hasDelta ? widget.delta : 0
        return `${delta >= 0 ? '+' : ''}${delta}%`
      }

      if (!hasDelta) {
        return ''
      }

      const sign = widget.delta >= 0 ? '+' : ''

      const period = widget.delta_period === 'month'
        ? this.$trans('this month')
        : this.$trans('this week')

      return `${sign}${widget.delta} ${period}`
    },
    // Only ask for what this user can actually see: a widget for a module
    // they have no access to is a query nobody reads.
    statsWidgets() {
      const widgets = ['open_orders', 'active_customers', 'orders_this_week']

      if (this.canSeeInventory) {
        widgets.push('low_stock', 'total_materials')
      }

      if (this.canSeeCustomers) {
        widgets.push('total_customers')
      }

      return widgets
    },
    async loadData() {
      this.isLoading = true

      // This one is for the recent-orders table, not for a counter.
      this.orderService.queryMode = 'all'
      this.orderService.currentPage = 1

      dashboardStatsModel.setListArgs(
        `widgets=${this.statsWidgets().join(',')}` +
        `&low_stock_threshold=${LOW_STOCK_THRESHOLD}`
      )

      const results = await Promise.allSettled([
        this.orderService.list(),
        dashboardStatsModel.list(),
      ])

      const [orders, stats] = results

      if (orders.status === 'fulfilled') {
        this.recentOrders = (orders.value.results || []).slice(0, RECENT_ORDERS_SHOWN)
      } else {
        console.error('error getting orders for the overview', orders.reason)
      }

      if (stats.status === 'fulfilled') {
        this.stats = stats.value.widgets || {}

        // Widgets that failed are reported rather than thrown, so the rest of
        // the dashboard still renders; their tiles fall back to a dash.
        if (stats.value.errors && stats.value.errors.length) {
          console.error('overview stats widgets failed', stats.value.errors)
        }
      } else {
        console.error('error getting stats for the overview', stats.reason)
      }

      this.isLoading = false
    }
  },
}

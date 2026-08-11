/*
 * Shared behaviour for the two Schedule designs.
 *
 * Both render the same FullCalendar over the same `order/month_events/`
 * source and open the same order modal; they differ only in the chrome
 * around the calendar (see ScheduleDefault.vue / ScheduleShltr.vue).
 *
 * Note: Vue 3 does not merge `setup()` from mixins, so each component
 * spreads `scheduleMixin.setup()` into its own.
 */
import BASE_URL from '@/services/base-url'
import client from '@/services/api'
import {OrderService} from '@/models/orders/Order'
import {useLoading} from 'vue-loading-overlay'
import {useMainStore} from '@/stores/main'
import componentMixin from '@/mixins/common'
import {nextTick} from 'vue'

// The mockup gives every order type its own tint. Which types a member has
// is tenant configuration, so the colours are handed out by position in
// `memberInfo.order_types` and wrap around when there are more than six.
// The classes themselves live in scss/shltr.scss.
export const ORDER_TYPE_COLOR_COUNT = 6

export default {
  mixins: [componentMixin],
  setup() {
    return {
      orderService: new OrderService(),
      loading: useLoading()
    }
  },
  props: {
    start: {
      type: [String],
      default: null
    },
    end: {
      type: [String],
      default: null
    },
  },
  data() {
    return {
      selectedOrder: null,
      // the order type of every event in the range currently loaded, in
      // load order — what the shltr design counts and filters over
      loadedEventTypes: [],
    }
  },
  computed: {
    orderTypes() {
      const store = useMainStore()
      return store.getOrderTypes || []
    },
  },
  methods: {
    // Position of an order type in the member's list, wrapped into the
    // palette. Unknown types (an order whose type was since removed) fall
    // back to the first colour.
    orderTypeColorIndex(orderType) {
      const index = this.orderTypes.indexOf(orderType)
      return index === -1 ? 0 : index % ORDER_TYPE_COLOR_COUNT
    },
    // Overridden by ScheduleShltr, which filters on the legend. The default
    // design has no filter, so everything the endpoint returns is shown.
    isOrderTypeVisible(orderType) {
      return true
    },
    async sourceChanged(fetchInfo, successCallback, failureCallback) {
      const start = fetchInfo.start
      const end = fetchInfo.end
      const eventUrl = `${BASE_URL}/api/order/order/month_events/?start=${start.getFullYear()}-${start.getMonth()+1}-${start.getDate()}&end=${end.getFullYear()}-${end.getMonth()+1}-${end.getDate()}`
      let loader = this.loading.show();
      try {
        const eventsResponse = await client.get(eventUrl)
        const events = eventsResponse.data
        loader.hide()
        // `groupId` is the order type; see OrderEventSerializer
        this.loadedEventTypes = events.map((event) => event.groupId)
        successCallback(events.map((event) => {
          const start = new Date(event.start)
          const end = new Date(event.end)
          const allDay = start.getHours() === 0 && end.getHours() === 0
          return {
            ...event,
            allDay,
            display: this.isOrderTypeVisible(event.groupId) ? 'auto' : 'none',
            className: [
              'my24-event',
              `my24-event-type-${this.orderTypeColorIndex(event.groupId)}`,
            ],
          };
        }))
      } catch (e) {
        failureCallback(e)
        loader.hide()
      }
    },
    async handleEventClick(clickInfo) {
      let loader = this.loading.show();
      try {
        this.selectedOrder = await this.orderService.detail(clickInfo.event.id)
        loader.hide()
        await nextTick()
        await this.$refs['order-info-modal'].show();
      } catch (e) {
        console.log('error loading order details', e)
        loader.hide()
      }
    },
  }
}

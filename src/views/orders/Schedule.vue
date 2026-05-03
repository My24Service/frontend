<template>
  <div>
    <div
      id="calendar"
    ></div>
    <b-modal
      id="order-info-modal"
      ref="order-info-modal"
      v-if="selectedOrder"
      :title="`${$trans('Order')} ${selectedOrder.order_id || '' }`"
      okOnly
    >
      <template #default="">
        {{ $trans('Order') }} {{ selectedOrder.order_id }}<br/>
        {{ selectedOrder.order_name }}<br/>
        {{ selectedOrder.order_address }}<br/>
        {{ selectedOrder.order_postal }} {{ selectedOrder.order_city }}<br/>
        {{ $trans('Order date') }}: {{ selectedOrder.order_date }}<br/>
        <span v-if="selectedOrder.order_reference">
              {{ $trans('Reference') }}: {{ selectedOrder.order_reference }}<br/>
          </span>
      </template>
    </b-modal>
  </div>
</template>
<script>
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import BASE_URL from '@/services/base-url'
import client from "@/services/api";
import 'bootstrap-icons/font/bootstrap-icons.css';
import locale from '@fullcalendar/core/locales/nl';
import {OrderService} from "@/models/orders/Order";
import {useLoading} from "vue-loading-overlay";
import componentMixin from "@/mixins/common";
import {nextTick} from "vue";

export default {
  components: {},
  setup() {
    return {
      orderService: new OrderService(),
      loading: useLoading()
    }
  },
  mixins: [componentMixin],
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
      tooltipModel: false,
    }
  },
  async mounted() {
    const calendarEl = document.getElementById('calendar')
    const calendar = new Calendar(calendarEl, {
      plugins: [
        dayGridPlugin,
        timeGridPlugin,
        interactionPlugin, // needed for dateClick
        bootstrap5Plugin,
      ],
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      initialView: 'dayGridMonth',
      events: this.sourceChanged,
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      eventClick: this.handleEventClick,
      defaultAllDay: true,
      themeSystem: 'bootstrap5',
      locale,
    });
    this.calendar = calendar
    calendar.render()
  },
  name: "OrdersSchedule",
  methods: {
    async sourceChanged(fetchInfo, successCallback, failureCallback) {
      const start = fetchInfo.start
      const end = fetchInfo.end
      const eventUrl = `${BASE_URL}/api/order/order/month_events/?start=${start.getFullYear()}-${start.getMonth()+1}-${start.getDate()}&end=${end.getFullYear()}-${end.getMonth()+1}-${end.getDate()}`
      let loader = this.loading.show();
      try {
        const eventsResponse = await client.get(eventUrl)
        const events = eventsResponse.data
        loader.hide()
        successCallback(events.map((event) => {
          const start = new Date(event.start)
          const end = new Date(event.end)
          const allDay = start.getHours() === 0 && end.getHours() === 0
          return {
            ...event,
            // className: 'btn btn-primary'
            allDay,
            className: 'my24-event'
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
</script>

<style scoped>
a.my24-event {
  overflow-wrap: break-word;
  white-space: wrap;
}
</style>

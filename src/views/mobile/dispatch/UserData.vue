<template>
  <div :class="containerDivClass">
    <strong>{{ orders.full_name }}</strong>
    <span
      v-for="userData of this.personOrders"
      @click="clickHandler(userData.order.id, userData.assignedOrder.id)"
      :key="userData.order.order_id"
      :style="`grid-column: calc(${userData.layout.slot} + 2) / span ${userData.layout.days}; --status-color: ${userData.order_color}; --text-color: ${userData.order_textColor};`"
      :class="orderClass">
      <span>
        <span class="dimmed order-type">{{ userData.order.order_id }} </span>
        <strong>{{ userData.order.order_name }} </strong>
      </span>
      <OrderInfo
        :order="userData.order"
        :order_start="userData.order_start"
        :order_end="userData.order_end"
      />

    </span>
  </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales';
import my24 from '@/services/my24'
import OrderInfo from "@/views/mobile/dispatch/OrderInfo.vue";

export default {
  name: "DispatchOrders",
  components: {
    OrderInfo
  },
  props: {
    orders: {
      type: [Object]
    },
    startDate: {
      type: [Date]
    },
    clickHandler: {
      type: Function
    },
    isAssignMode: {
      type: Boolean,
      default: false
    },
    alreadyAssigned: {
      type: Boolean,
    },
  },
  computed: {
    containerDivClass: function() {
      return this.alreadyAssigned ? 'already-assigned' : ''
    },
    orderClass: function() {
      return this.isAssignMode ? 'order-assign-mode' : 'order'
    }
  },
  data () {
    return {
      statuscodes: null,
      personOrders: null
    }
  },

  methods: {
    loadData () {
      this.personOrders = []

      for (const assignedOrder of this.orders.assignedorders) {
        if (Object.keys(assignedOrder.order).length === 0) {
          continue
        }

        const orderObj = {
          ...assignedOrder.order,
          assignedorder_status: assignedOrder.last_status
        }
        let orderStartDate = assignedOrder.start_date
        let orderEndDate = assignedOrder.end_date

        let start = moment(orderStartDate);
        let end = moment(orderEndDate);
        let days = end.diff(start, 'days') + 1;
        let gridSlot = parseInt(start.diff(this.startDate, 'days'));

        if (gridSlot < 1) {
          days += gridSlot;
          gridSlot = 0;
        }

        const statuscode = my24.getStatuscodeForOrder(this.statuscodes, orderObj)
        const color = my24.getStatuscodeColor(statuscode)
        const textColor = my24.getStatuscodeColor(statuscode, true)

        const order = {
          assignedOrder: assignedOrder,
          order: orderObj,
          person: this.orders.full_name,
          order_start: orderStartDate,
          order_end: orderEndDate,
          order_color: color,
          order_textColor: textColor,
          layout: {
            slot: gridSlot, days, d: start.format('MMM DD') + '-' + end.format('MMM DD'),
          }
        }

        this.personOrders.push(order)
      }
    }
  },
  async created() {
    this.personOrders = []
    this.statuscodes = await this.$store.dispatch('getStatuscodes');
    this.loadData();
  }
}
</script>

<style></style>

<template>
  <div>
    <strong>{{  orders.full_name }}</strong>
    <span 
      v-for="order of this.personOrders"
      @click="clickHandler(order.order_pk, order.assignedorder_pk)"
      :key="order.order_id"
      :style="`grid-column: calc(${order.layout.slot} + 2) / span ${order.layout.days}; --status-color: ${order.order_color}; --text-color: ${order.order_textColor};`" 
      class="order">
      <span>
        <span class="dimmed order-type">{{ order.order_id }} </span>
        <strong>{{ order.order_name }} </strong>
        <small class="">{{  order.layout }}</small>
        <span> {{ order.order_type }} </span>
      </span>
      <small> {{ order.order_start }} - {{ order.order_end }} ({{ order.layout.days }} days) </small>
      <code>{{`grid-column: ${(order.layout.slot)} / span ${+order.layout.days};`}}</code>
    </span>
  </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales';
import my24 from '@/services/my24'
export default {
  name: "DispatchOrders",
  props: {
    orders: {
      type: [Object]
    },
    startDate: {
      type: [Date]
    },
    clickHandler: {
      type: Function
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
      this.personOrders = [];
      
      const orderStartKeys = Object.keys(this.orders.assignedorders.start);
      const orderEndKeys = Object.keys(this.orders.assignedorders.end);

        orderStartKeys.map( (key, index) => {
          
          let orderStartDate = Object.keys(this.orders.assignedorders.start)[index];
          let orderEndDate = Object.keys(this.orders.assignedorders.end)[index];

          let start = moment(orderStartDate);
          let end = moment(orderEndDate);
          let days = end.diff(start, 'days') + 1;
          let gridslot = parseInt(start.diff(this.startDate, 'days')) ;

          if(gridslot < 1) { 
            days += gridslot;
            gridslot = 0;
          }

          const statuscode = my24.getStatuscodeForOrder(this.statuscodes, this.orders.assignedorders.start[key][0])
          const color = my24.getStatuscodeColor(statuscode)
          const textColor = my24.getStatuscodeColor(statuscode, true)

          const order = {
            person: this.orders.full_name,
            order_id: this.orders.assignedorders.start[key][0].order_id,
            order_name: this.orders.assignedorders.start[key][0].order_name,
            order_pk: this.orders.assignedorders.start[key][0].order_pk,
            order_type: this.orders.assignedorders.start[key][0].order_type,
            order_start: orderStartKeys[index],
            order_end: orderEndKeys[index],
            order_status: this.orders.assignedorders.start[key][0].order_status,
            assignedorder_status: this.orders.assignedorders.start[key][0].assignedorder_status,
            assignedorder_pk: this.orders.assignedorders.start[key][0].assignedorder_pk,
            order_color: color,
            order_textColor: textColor,
            layout: {
              slot: gridslot, days, d: start.format('MMM DD') +'-'+ end.format('MMM DD'),
            }
            

          };
          this.personOrders.push(order);
        })
    }
  },
  watch : {
    startDate(oldVal, newVal) {
      this.personOrders = [];
      this.loadData();
    }
  },
  async created() {
    this.statuscodes = await this.$store.dispatch('getStatuscodes');
    this.loadData();
  }
}
</script>

<style></style>
<template>
  <div :class="infoClass">
    <dl>
      <dt>{{ $trans('Order ID') }}</dt>
      <dd><strong>{{ order.order_id }}</strong></dd>
      <dt>{{ $trans('Date') }}</dt>
      <dd><p>{{ assignedOrder.date_formatted }}</p></dd>
      <dt>{{ $trans('Order type') }}</dt>
      <dd><p>{{ order.order_type }}</p></dd>
      <dt>{{ $trans('Order status') }}</dt>
      <dd><p>{{ order.last_status }}</p></dd>
      <dt v-if="assignedOrder.last_status">{{ $trans('Assigned order status') }}</dt>
      <dd v-if="assignedOrder.last_status"><p>{{ assignedOrder.last_status }}</p></dd>
    </dl>
    <p v-if="order.orderlines.length"><strong><small>{{ $trans("Orderlines") }}</small></strong></p>
    <dl v-if="order.orderlines.length">
      <!-- eslint-disable-next-line vue/no-v-for-template-key -->
      <template v-for="orderline in order.orderlines" :key="orderline.id">
        <dt>{{ $trans("Product") }}</dt>
        <dd>{{ orderline.product }}</dd>
        <dt>{{ $trans("Location") }}</dt>
        <dd>{{ orderline.location }}</dd>
      </template>
    </dl>
  </div>

</template>
<script>

export default {
  name: "OrderInfo",
  props: {
    gridSlot: {
      type: [String, Number]
    },
    order: {
      type: [Object]
    },
    assignedOrder: {
      type: [Object]
    },
    order_start: {
      type: [String]
    },
    order_end: {
      type: [String]
    },
  },
  computed: {
    infoClass: function() {
      return parseInt(this.gridSlot) < 4 ? 'order-info right' : 'order-info left'
    }
  }
}
</script>
<style scoped>

</style>

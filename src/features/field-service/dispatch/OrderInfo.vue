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

<script setup lang="ts">
import { $trans } from '@/services/i18n'
import type { DispatchBoardAssignedOrder, DispatchBoardOrder } from './dispatch-window'

/**
 * What an order box shows about the order behind it.
 *
 * The block sits to the right of the box for the first four grid columns and
 * to the left of it for the rest, which is the whole of `infoClass`: an order
 * near the end of the week opens its detail backwards so it stays on screen.
 */
const props = defineProps<{
  gridSlot: string | number
  order: DispatchBoardOrder
  assignedOrder: DispatchBoardAssignedOrder
}>()

const infoClass = computed(() => (parseInt(String(props.gridSlot)) < 4 ? 'order-info right' : 'order-info left'))
</script>

<style scoped>
</style>

<template>
  <b-modal
    v-if="order"
    id="order-info-modal"
    ref="modal"
    :title="`${$trans('Order')} ${order.order_id || ''}`"
    ok-only
  >
    {{ $trans('Order') }} {{ order.order_id }}<br>
    {{ order.order_name }}<br>
    {{ order.order_address }}<br>
    {{ order.order_postal }} {{ order.order_city }}<br>
    {{ $trans('Order date') }}: {{ order.order_date }}<br>
    <span v-if="order.order_reference">
      {{ $trans('Reference') }}: {{ order.order_reference }}<br>
    </span>
  </b-modal>
</template>

<script lang="ts" setup>
import type { OrderDetail } from '@/api/types.gen'
import { $trans } from '@/services/i18n'

/** The order an event click opens: who, where, when. */
defineProps<{
  order: OrderDetail | null
}>()

const modal = useTemplateRef<{show: () => void}>('modal')

defineExpose({show: () => modal.value?.show()})
</script>

<template>
  <b-modal
    id="order-info-modal"
    ref="modal"
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
</template>

<script>
import componentMixin from '@/mixins/common'

export default {
  name: 'ScheduleOrderModal',
  mixins: [componentMixin],
  props: {
    selectedOrder: {
      type: Object,
      default: null
    }
  },
  methods: {
    // so the views can keep calling `$refs['order-info-modal'].show()`
    show() {
      return this.$refs.modal.show()
    }
  }
}
</script>

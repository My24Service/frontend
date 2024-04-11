<template>
  <div class="user-data">
    <dl>
      <dt>{{ $trans('Name') }}</dt>
      <dd><strong>{{ order.order_name }}</strong></dd>
      <dt>{{ $trans('Order type') }}</dt>
      <dd><strong>{{ order.order_type }}</strong></dd>

    </dl>

  </div>

</template>
<script>
export default {
  name: "OrderInfo",
  props: {
    order: {
      type: [Object]
    },
    order_start: {
      type: [String]
    },
    order_end: {
      type: [String]
    },
  }
}
</script>
<style scoped>

</style>

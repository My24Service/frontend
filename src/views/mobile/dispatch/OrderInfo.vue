<template>
  <div>
    <table>
      <tr>
        <td>{{ $trans("Name") }}</td>
        <td><strong>{{ order.order_name }} </strong></td>
      </tr>
      <tr>
        <td>{{ $trans("Order type") }}</td>
        <td><span> {{ order.order_type }} </span></td>
      </tr>

    </table>

  </div>

</template>
<script>
export default {
  name: "OrderInfo",
  props: {
    order: {
      type: [Object]
    },
  }
}
</script>
<style scoped>

</style>

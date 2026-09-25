<template>
  <h6><IBiPerson />{{ $trans("Contact") }}</h6>
  <div
    class="flex-columns space-between"
    style="max-width: 60ch; margin-inline: auto"
  >
    <p>
      {{ order.order_contact }}<br>
      <BLink :href="`mailto:${order.order_email}`">{{ order.order_email }}</BLink><br>
      {{ order.order_tel }}<br>
      {{ order.order_mobile }}<br>
    </p>
    <address>
      <strong>{{ order.order_name }}</strong><br>
      {{ order.order_address }}<br>
      {{ order.order_postal }}<br>
      {{ order.order_city }}, {{ order.order_country_code }}
    </address>
  </div>
</template>

<script setup lang="ts">

/**
 * The read-only contact block both order details render: the temps view
 * and the maintenance summary panel wrote it out identically.
 */
export type OrderContact = Pick<Api.OrderDetail,
  | 'order_contact'
  | 'order_email'
  | 'order_tel'
  | 'order_mobile'
  | 'order_name'
  | 'order_address'
  | 'order_postal'
  | 'order_city'
  | 'order_country_code'
>

defineProps<{
  order: OrderContact
}>()
</script>

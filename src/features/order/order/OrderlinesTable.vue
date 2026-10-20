<template>
  <h6 v-if="lines.length">{{ $trans('Orderlines') }}</h6>
  <table
    id="orderlines-table"
    class="table table-sm data-table"
  >
    <thead v-if="lines.length">
      <tr>
        <th style="width: 30%">{{ $trans('Product') }}</th>
        <th style="width: 30%">{{ $trans('Location') }}</th>
        <th style="width: 40%">{{ $trans('Remarks') }}</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="line in lines"
        :key="line.id"
      >
        <td>{{ line.product }}</td>
        <td>{{ line.location }}</td>
        <td>{{ line.remarks }}</td>
      </tr>
    </tbody>
  </table>
  <h6
    v-if="!lines.length"
    class="dimmed"
  >
    {{ $trans('No orderlines') }}
  </h6>
</template>

<script setup lang="ts">
/**
 * The read-only orderlines table both order details render: the temps
 * view over the record's own lines, the maintenance contents panel over
 * the equipment-displayed ones.
 */
defineProps<{
  lines: Api.OrderLine[]
}>()
</script>

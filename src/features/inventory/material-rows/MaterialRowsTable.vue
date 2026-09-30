<template>
  <b-table
    :id="tableId"
    :fields="fields"
    :sort-by="[{key: 'material_view.name', order: 'asc'}]"
    :items="items"
    responsive="sm"
  />
</template>

<script setup lang="ts">
import type { MaterialRowRecord } from './use-material-rows'

/**
 * The products a purchase order or a reservation holds, read-only: the two
 * detail views' table. A stored row carries its product as `material_view`.
 * The table's own look (`dark`, `small`, ...) falls through to it.
 */
defineProps<{
  /** The table's DOM id, kept per screen. */
  tableId: string
  items: readonly MaterialRowRecord[]
}>()

const fields = [
  {key: 'material_view.name', label: $trans('Name')},
  {key: 'amount', label: $trans('Amount')},
  {key: 'remarks', label: $trans('Remarks')},
]
</script>

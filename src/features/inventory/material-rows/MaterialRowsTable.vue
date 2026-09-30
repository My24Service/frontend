<template>
  <b-table
    :id="tableId"
    :dark="dark"
    :borderless="dark"
    :small="dark"
    :fields="fields"
    :sort-by="[{key: 'material_view.name', order: 'asc'}]"
    :items="items"
    responsive="sm"
  />
</template>

<script setup lang="ts">
/**
 * The products a purchase order or a reservation holds, read-only: the two
 * detail views' table. A stored row carries its product as `material_view`.
 */
withDefaults(defineProps<{
  /** The table's DOM id, kept per screen. */
  tableId: string
  items: readonly {amount?: number; remarks?: string | null; material_view: {name?: string | null}}[]
  /** The reservation view's dark, borderless variant. */
  dark?: boolean
}>(), {
  dark: false,
})

const fields = [
  {key: 'material_view.name', label: $trans('Name')},
  {key: 'amount', label: $trans('Amount')},
  {key: 'remarks', label: $trans('Remarks')},
]
</script>

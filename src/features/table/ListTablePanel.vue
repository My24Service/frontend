<template>
  <div class="app-detail panel overflow-auto">
    <div class="data-table">
      <ServerDataTable
        :table="table"
        :is-loading="isLoading"
        :empty-text="emptyText"
        :row-class="rowClass"
      />
    </div>
  </div>

  <ServerTablePagination
    v-if="!isLoading"
    :table="table"
    :pagination="pagination"
    :count="count"
    :label="label"
    :is-fetching="isFetching"
  />
</template>

<script setup lang="ts" generic="TData extends RowData">
import type { PaginationState, RowData, VueTable } from '@tanstack/vue-table'
import ServerDataTable from './ServerDataTable.vue'
import ServerTablePagination from './ServerTablePagination.vue'
import type { AppFeatures } from './table'

/**
 * The `app-detail panel overflow-auto > data-table` wrapper plus the
 * pagination block (with its `v-if="!isLoading"`) — identical across every
 * list screen. Headless like `ServerDataTable`/`ServerTablePagination`
 * underneath it: it holds no state, only wires the two through.
 *
 * Wired to this branch's table kit, not the source branch's: our
 * `ServerTablePagination` takes its page state as explicit `:pagination`
 * and `:count` props (it does not read them off the table instance), so
 * this panel takes and forwards both.
 */
defineProps<{
  table: VueTable<AppFeatures, TData>
  pagination: PaginationState
  count?: number
  isLoading?: boolean
  isFetching?: boolean
  emptyText?: string
  label?: string
  /** Per-row class from the row's data — the customer list's branch highlight. */
  rowClass?: (row: TData) => string
}>()
</script>

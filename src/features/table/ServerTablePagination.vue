<template>
  <!-- Shrink-wrapped and centred: the bar takes the width of its controls,
       not the full page. -->
  <div class="d-flex justify-content-center my-2">
    <div class="d-inline-flex align-items-center gap-2 server-table-pagination">
      <button
        class="btn btn-sm btn-outline-secondary"
        :disabled="!table.getCanPreviousPage()"
        :aria-label="$trans('First page')"
        @click="table.firstPage()"
      >«</button>
      <button
        class="btn btn-sm btn-outline-secondary"
        :disabled="!table.getCanPreviousPage()"
        :aria-label="$trans('Previous page')"
        @click="table.previousPage()"
      >‹</button>
      <span class="small page-status">
        {{ $trans('Page') }} {{ pagination.pageIndex + 1 }} / {{ Math.max(table.getPageCount(), 1) }}
      </span>
      <button
        class="btn btn-sm btn-outline-secondary"
        :disabled="!table.getCanNextPage()"
        :aria-label="$trans('Next page')"
        @click="table.nextPage()"
      >›</button>
      <button
        class="btn btn-sm btn-outline-secondary"
        :disabled="!table.getCanNextPage()"
        :aria-label="$trans('Last page')"
        @click="table.lastPage()"
      >»</button>
      <select
        :aria-label="$trans('Rows per page')"
        class="form-select form-select-sm w-auto"
        :value="pagination.pageSize"
        @change="onPageSizeChange($event)"
      >
        <option
          v-for="size in pageSizeOptions"
          :key="size"
          :value="size"
        >{{ size }} {{ $trans('rows') }}</option>
      </select>
      <span
        v-if="isFetching"
        class="small text-muted"
      >{{ $trans('Updating...') }}</span>
      <span class="small row-count">{{ count }} {{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts" generic="TData extends RowData">
import type { PaginationState, RowData, VueTable } from '@tanstack/vue-table'
import { $trans } from '@/utils'
import type { AppFeatures } from './table'

/**
 * The controls half of the shared server-paged table: first/previous/next/
 * last, a page indicator, the rows-per-page select and the row count. Like
 * `ServerDataTable` it calls the table instance's APIs directly and holds no
 * state of its own; `pagination` and `count` are passed in read-only so the
 * template stays reactive to the state `useServerPagedList` owns.
 */
const props = withDefaults(defineProps<{
  table: VueTable<AppFeatures, TData>
  pagination: PaginationState
  count?: number
  /** What the rows are, for the count label — the variant's label. */
  label?: string
  isFetching?: boolean
  pageSizeOptions?: number[]
}>(), {
  count: 0,
  label: '',
  isFetching: false,
  pageSizeOptions: () => [10, 20, 50],
})

function onPageSizeChange(event: Event) {
  props.table.setPageSize(Number((event.target as HTMLSelectElement).value))
}
</script>

<style scoped>
.page-status,
.row-count {
  white-space: nowrap;
}
</style>

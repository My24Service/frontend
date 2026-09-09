<template>
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

const props = withDefaults(defineProps<{
  table: VueTable<AppFeatures, TData>
  pagination: PaginationState
  count?: number
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

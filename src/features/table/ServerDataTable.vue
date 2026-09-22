<template>
  <table class="table table-hover table-sm data-table-inner">
    <colgroup>
      <col
        v-for="header in headers"
        :key="header.id + '-col'"
        :style="colStyle(header)"
      />
    </colgroup>
    <thead>
      <tr>
        <th
          v-for="header in headers"
          :key="header.id"
          :aria-sort="ariaSort(header)"
          :class="{'sortable-header': header.column.getCanSort()}"
          :aria-label="header.column.getCanSort() ? `Sort by ${header.column.id}` : undefined"
          @click="header.column.getToggleSortingHandler()?.($event)"
        >
          <template v-if="!header.isPlaceholder">
            <FlexRender :header="header" />
            <span class="sort-indicator">
              {{ header.column.getIsSorted() === 'asc' ? '▲' : header.column.getIsSorted() === 'desc' ? '▼' : '' }}
            </span>
          </template>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-if="isLoading"
        class="table-state-row"
      >
        <td :colspan="columnCount">
          <b-spinner small class="align-middle" />&nbsp;&nbsp;<strong>{{ loadingText }}</strong>
        </td>
      </tr>
      <tr
        v-for="row in table.getRowModel().rows"
        :key="row.id"
        :class="rowClass?.(row.original)"
      >
        <td
          v-for="cell in row.getAllCells()"
          :key="cell.id"
        >
          <FlexRender :cell="cell" />
        </td>
      </tr>
      <tr
        v-if="!isLoading && table.getRowModel().rows.length === 0"
        class="table-state-row"
      >
        <td :colspan="columnCount">{{ emptyText }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts" generic="TData extends RowData">
import {
  FlexRender,
  type Header,
  type RowData,
  type VueTable,
} from '@tanstack/vue-table'
import type { AppFeatures } from './table'

const props = defineProps<{
  table: VueTable<AppFeatures, TData>
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
  rowClass?: (row: TData) => string
}>()

const headerGroup = computed(() => props.table.getHeaderGroups()[0])
const headers = computed(() => headerGroup.value?.headers ?? [])
const columnCount = computed(() => headers.value.length)
const loadingText = computed(() => props.loadingText ?? $trans('Loading...'))
const emptyText = computed(() => props.emptyText ?? $trans('No rows found'))

function ariaSort(header: Header<AppFeatures, TData, unknown>): 'ascending' | 'descending' | 'none' {
  const sorted = header.column.getIsSorted()
  return sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'
}

function colStyle(header: Header<AppFeatures, TData, unknown>): {width: string} | undefined {
  const width = header.column.columnDef.meta?.width
  return width ? {width} : undefined
}
</script>

<style scoped>
.data-table-inner thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--bs-body-bg);
  box-shadow: inset 0 -1px 0 var(--bs-border-color);
}

th.sortable-header {
  cursor: pointer;
  user-select: none;
}

th.sortable-header:hover {
  background-color: var(--bs-tertiary-bg);
}

.sort-indicator {
  display: inline-block;
  min-width: 1.1em;
  margin-left: 0.25rem;
  color: var(--bs-primary);
}

.table-state-row td {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--bs-secondary-color);
}

tbody td {
  vertical-align: middle;
}
</style>

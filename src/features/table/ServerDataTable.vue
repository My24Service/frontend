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
      <tr
        v-if="hasFilterInputs"
        class="filter-row"
      >
        <th
          v-for="header in headers"
          :key="header.id + '-filter'"
        >
          <input
            v-if="filterVariant(header) === 'text'"
            :aria-label="`Filter ${header.column.id}`"
            class="form-control form-control-sm"
            :placeholder="filterPlaceholder(header)"
            :value="filterValue(header)"
            @input="onFilterInput(header, $event)"
          />
          <select
            v-else-if="filterVariant(header) === 'select'"
            :aria-label="`Filter ${header.column.id}`"
            class="form-select form-select-sm"
            :value="filterValue(header)"
            @change="onFilterInput(header, $event)"
          >
            <option value=""></option>
            <option
              v-for="option in selectOptions(header)"
              :key="option.value"
              :value="option.value"
            >{{ option.label }}</option>
          </select>
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
import { FlexRender } from '@tanstack/vue-table'
import type { Header, RowData, VueTable } from '@tanstack/vue-table'
import { $trans } from '@/services/i18n'
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
const hasFilterInputs = computed(() => headers.value.some((header) => filterVariant(header) !== undefined))

function ariaSort(header: Header<AppFeatures, TData, unknown>): 'ascending' | 'descending' | 'none' {
  const sorted = header.column.getIsSorted()
  return sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'
}

function filterVariant(header: Header<AppFeatures, TData, unknown>): string | undefined {
  if (!header.column.getCanFilter()) return undefined
  return header.column.columnDef.meta?.filterVariant
}

function colStyle(header: Header<AppFeatures, TData, unknown>): {width: string} | undefined {
  const width = header.column.columnDef.meta?.width
  return width ? {width} : undefined
}

function filterPlaceholder(header: Header<AppFeatures, TData, unknown>): string | undefined {
  return header.column.columnDef.meta?.filterPlaceholder
}

function selectOptions(header: Header<AppFeatures, TData, unknown>): Array<{value: string; label: string}> {
  return header.column.columnDef.meta?.selectOptions ?? []
}

function filterValue(header: Header<AppFeatures, TData, unknown>): string {
  const value = header.column.getFilterValue()
  return typeof value === 'string' ? value : ''
}

function onFilterInput(header: Header<AppFeatures, TData, unknown>, event: Event) {
  const value = (event.target as HTMLInputElement).value
  header.column.setFilterValue(value || undefined)
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

thead .filter-row th {
  position: sticky;
  top: 38px;
  z-index: 1;
  background: var(--bs-body-bg);
  border-top: 0;
  padding-top: 0;
  font-weight: 400;
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

<template>
  <div class="app-page">
    <ServerTable
      ref="tableRef"
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :title="$trans('Stock Locations')"
      :search-label="$trans('Search stock locations')"
      :label="$trans('Location')"
      :empty-text="$trans('No stock locations found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-stock-location-modal',
        confirmText: $trans('Are you sure you want to delete this stock location?'),
        resource: Api.InventoryStockLocation,
        deletedDetail: $trans('Stock location has been deleted'),
        deleteError: $trans('Error deleting stock location'),
      }"
    >
      <template #icon><IBiBookshelf /></template>
      <template #add>
        <router-link
          :to="{name: 'stock-location-add'}"
          class="btn btn-primary"
        >{{ $trans('Add stock location') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import IBiCheckSquareFill from '~icons/bi/check-square-fill'
import { ServerTable, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'

/**
 * The stock location list. The row action is delete only, as the legacy list
 * had: the name links to the view, which carries the edit link.
 *
 * No column sorts. The legacy table sorted the rows of the loaded page in the
 * browser; the endpoint declares no `ordering`, so the table's server-side
 * sort would send a parameter nothing reads. See the module README.
 */
type StockLocationRow = ListRow<Api.InventoryStockLocation.ListResponse>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const helper = createAppColumnHelper<StockLocationRow>()

const columns = helper.columns([
  helper.accessor('name', {
    header: $trans('Name'),
    cell: ({row}) => h(RouterLink, {
      to: {name: 'stock-location-view', params: {pk: row.original.id}},
    }, () => row.original.name),
  }),
  helper.accessor('identifier', {header: $trans('Identifier')}),
  helper.accessor('inventory', {header: $trans('Inventory')}),
  helper.accessor('show_in_stats', {
    header: $trans('In stats?'),
    cell: ({row}) => (row.original.show_in_stats ? h('span', [h(IBiCheckSquareFill)]) : null),
  }),
  helper.accessor('created', {header: $trans('Created')}),
  helper.accessor('modified', {header: $trans('Modified')}),
  createActionColumn(helper, {
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<StockLocationRow>({
  key: 'stock-location-table',
  columns,
  enableSorting: false,
  resource: Api.InventoryStockLocation,
  urlSync: true,
  loadError: $trans('Error loading stock locations'),
})
</script>

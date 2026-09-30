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
      :title="$trans('Entries')"
      :search-label="$trans('Search entries')"
      :label="$trans('Entry')"
      :empty-text="$trans('No entries found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-purchaseorder-entry-modal',
        confirmText: $trans('Are you sure you want to delete this entry?'),
        resource: Api.InventoryPurchaseorderEntry,
        deletedDetail: $trans('Entry has been deleted'),
        deleteError: $trans('Error deleting entry'),
      }"
    >
      <template #icon><IBiReceipt /></template>
      <template #add>
        <router-link
          :to="{name: 'purchaseorder-entry-add'}"
          class="btn btn-primary"
        >{{ $trans('Add entry') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ServerTable, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'

/**
 * The purchase-order entries: what was booked in, per order and product. The
 * order id opens the edit; the row action deletes.
 *
 * No column sorts. The endpoint declares no `ordering`, and the legacy
 * headers sorted only the rows of the page on screen (see the module README).
 */
type EntryRow = ListRow<Api.PaginatedPurchaseOrderEntryList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const helper = createAppColumnHelper<EntryRow>()

const columns = helper.columns([
  helper.accessor('order_id', {
    header: $trans('Order ID'),
    enableSorting: false,
    cell: ({ row }) => h(RouterLink, {
      to: { name: 'purchaseorder-entry-edit', params: { pk: row.original.id } },
    }, () => row.original.order_id),
  }),
  helper.accessor('supplier', {header: $trans('Supplier'), enableSorting: false}),
  helper.accessor('material_name', {header: $trans('Product'), enableSorting: false}),
  helper.accessor('amount', {header: $trans('Amount'), enableSorting: false}),
  helper.accessor('entry_date', {header: $trans('Entry date'), enableSorting: false}),
  helper.accessor('stock_location_name', {header: $trans('Moved to location'), enableSorting: false}),
  createActionColumn(helper, {
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

const { table, searchDraft, pagination, count, isLoading, isFetching, refresh } = useServerTable<EntryRow>({
  key: 'purchaseorder-entry-table',
  columns,
  resource: Api.InventoryPurchaseorderEntry,
  urlSync: true,
  loadError: $trans('Error loading entries'),
})
</script>

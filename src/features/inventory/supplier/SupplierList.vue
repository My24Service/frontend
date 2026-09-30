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
      :title="$trans('Suppliers')"
      :search-label="$trans('Search suppliers')"
      :label="$trans('Supplier')"
      :empty-text="$trans('No suppliers found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-supplier-modal',
        confirmText: $trans('Are you sure you want to delete this supplier?'),
        resource: Api.InventorySupplier,
        deletedDetail: $trans('Supplier has been deleted'),
        deleteError: $trans('Error deleting supplier'),
      }"
    >
      <template #icon><IBiShop /></template>
      <template #add>
        <router-link
          :to="{name: 'supplier-add'}"
          class="btn btn-primary"
        >{{ $trans('Add supplier') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ServerTable, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'

/**
 * The supplier list. The row action is delete only, as the legacy list had:
 * the name links to the view, which carries the edit link.
 *
 * No column sorts. The legacy table sorted the rows of the loaded page in the
 * browser; the endpoint declares no `ordering`, so the table's server-side
 * sort would send a parameter nothing reads. See the module README.
 */
type SupplierRow = ListRow<Api.InventorySupplier.ListResponse>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const helper = createAppColumnHelper<SupplierRow>()

const columns = helper.columns([
  helper.accessor('name', {
    header: $trans('Name'),
    cell: ({row}) => h(RouterLink, {
      to: {name: 'supplier-view', params: {pk: row.original.id}},
    }, () => row.original.name),
  }),
  helper.accessor('address', {header: $trans('Address')}),
  helper.accessor('city', {header: $trans('City')}),
  helper.accessor('tel', {header: $trans('Tel.')}),
  helper.accessor('mobile', {header: $trans('Mobile')}),
  createActionColumn(helper, {
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<SupplierRow>({
  key: 'supplier-table',
  columns,
  enableSorting: false,
  resource: Api.InventorySupplier,
  urlSync: true,
  loadError: $trans('Error loading suppliers'),
})
</script>

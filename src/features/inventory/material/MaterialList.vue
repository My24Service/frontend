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
      :title="$trans('Materials')"
      :search-label="$trans('Search materials')"
      :label="$trans('Material')"
      :empty-text="$trans('No materials found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-material-modal',
        confirmText: $trans('Are you sure you want to delete this material?'),
        resource: Api.InventoryMaterial,
        deletedDetail: $trans('Material has been deleted'),
        deleteError: $trans('Error deleting material'),
      }"
    >
      <template #icon><IBiBox /></template>
      <template #add>
        <router-link
          :to="{name: 'material-add'}"
          class="btn btn-primary"
        >{{ $trans('Add material') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ServerTable, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'

/**
 * The material list. The row action is delete only, as the legacy list had:
 * the name links to the view, which carries the edit link.
 *
 * No column sorts. The legacy table sorted the rows of the loaded page in the
 * browser; the endpoint declares no `ordering`, so the table's server-side
 * sort would send a parameter nothing reads. See the module README.
 */
type MaterialRow = ListRow<Api.InventoryMaterial.ListResponse>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const helper = createAppColumnHelper<MaterialRow>()

const columns = helper.columns([
  helper.accessor('show_name', {
    header: $trans('Name'),
    meta: {width: '25%'},
    cell: ({row}) => h(RouterLink, {
      to: {name: 'material-view', params: {pk: row.original.id}},
    }, () => row.original.show_name),
  }),
  helper.accessor('identifier', {header: $trans('Identifier'), meta: {width: '10%'}}),
  helper.accessor('location', {header: $trans('Location'), meta: {width: '10%'}}),
  helper.accessor('price_purchase', {header: $trans('Purchase price'), meta: {width: '10%'}}),
  helper.accessor('price_selling', {header: $trans('Selling price'), meta: {width: '10%'}}),
  helper.accessor('supplier_name', {header: $trans('Supplier'), meta: {width: '15%'}}),
  helper.accessor('modified', {header: $trans('Modified'), meta: {width: '10%'}}),
  createActionColumn(helper, {
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<MaterialRow>({
  key: 'material-table',
  columns,
  enableSorting: false,
  resource: Api.InventoryMaterial,
  urlSync: true,
  loadError: $trans('Error loading materials'),
})
</script>

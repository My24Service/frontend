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
      :title="$trans('Maintenance contracts')"
      :search-label="$trans('Search maintenance contracts')"
      :refresh="refresh"
      :empty-text="$trans('No maintenance contracts found')"
      :label="$trans('Contract')"
      :delete-modal="{
        modalId: 'delete-maintenance-contract-modal',
        confirmText: $trans('Are you sure you want to delete this maintenance contract?'),
        resource: Api.CustomerMaintenanceContract,
        deletedDetail: $trans('Maintenance contract has been deleted'),
        deleteError: $trans('Error deleting maintenance contract'),
      }"
    >
      <template #icon><IBiFileEarmarkLock></IBiFileEarmarkLock></template>
      <template #add>
        <router-link
          :to="{name: 'maintenance-contract-add'}"
          class="btn btn-primary"
        >
          {{ $trans('Add contract') }}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import { RouterLink } from 'vue-router'

import { formatMoney, toDinero } from '@/services/money'
import { ServerTable, createActionColumn, createAppColumnHelper, useServerTable, type FilterOption, type ListRow } from '@/features/table'

type ContractRow = ListRow<Api.PaginatedMaintenanceContractList>

/** An autocomplete row as a filter choice: its id on the wire, its name on the chip. */
function customerOptions(rows: Api.AddressAutocompleteRow[]): FilterOption[] {
  return rows.map((row) => ({value: String(row.id), label: row.name ?? row.value}))
}

const queryClient = useQueryClient()

// The screen's handle on the table: the icon column calls the delete modal
// through it, before this ref is populated. Typed structurally because
// ServerTable is generic over the row type.
const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const mainStore = useMainStore()

function dineroFor(row: ContractRow) {
  // sum_tariffs is required on the contract; the tenant default prices it.
  return toDinero(row.sum_tariffs, mainStore.getDefaultCurrency)
}

const columnHelper = createAppColumnHelper<ContractRow>()

const columns = columnHelper.columns([
  columnHelper.accessor('name', {
    header: $trans('Contract name'),
    meta: {filter: {variant: 'text', label: $trans('Contract name')}},
    cell: (info) => h(RouterLink, {
      to: {name: 'maintenance-contract-view', params: {pk: info.row.original.id}},
    }, () => info.getValue()),
  }),
  // The cell shows the customer's name; the endpoint filters on its id.
  columnHelper.accessor((row) => row.customer_view?.name, {
    id: 'customer_view_name',
    header: $trans('Customer'),
    meta: {filter: {
      variant: 'select',
      label: $trans('Customer'),
      param: 'customer',
      loadOptions: (term) => queryClient
        .fetchQuery(Api.CustomerCustomerAutocomplete.list.options({query: {q: term}}))
        .then(customerOptions),
      resolveLabels: (ids) => queryClient
        .fetchQuery(Api.CustomerCustomerAutocomplete.list.options({query: {id: ids.join(',')}}))
        .then(customerOptions),
    }},
  }),
  columnHelper.accessor('sum_tariffs', {
    header: $trans('Contract value'),
    cell: (info) => h('span', formatMoney(dineroFor(info.row.original))),
  }),
  columnHelper.accessor('remarks', {
    header: $trans('Remarks'),
    meta: {filter: {variant: 'text', label: $trans('Remarks')}},
  }),
  columnHelper.accessor('created', {
    header: $trans('Created'),
    cell: (info) => h('small', info.getValue()),
  }),
  createActionColumn(columnHelper, {
    editRoute: 'maintenance-contract-edit',
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<ContractRow>({
  key: 'maintenance-contract-table',
  columns,
  resource: Api.CustomerMaintenanceContract,
  urlSync: true,
  loadError: $trans('Error loading maintenance contracts'),
})
</script>

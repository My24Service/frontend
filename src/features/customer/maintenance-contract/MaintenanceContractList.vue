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
        destroyMutation: customerMaintenanceContractDestroyMutation,
        invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: customerMaintenanceContractListQueryKey()}),
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
import {
  customerMaintenanceContractDestroyMutation,
  customerMaintenanceContractListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { CustomerMaintenanceContractListData, PaginatedMaintenanceContractList } from '@/api/types.gen'
import { toDinero } from '@/services/money'
import { useMainStore } from '@/stores/main'
import { $trans } from '@/services/i18n'
import { customerMaintenanceContractListQueryKey } from '@/api/@tanstack/vue-query.gen'
import {
  ServerTable,
  baseListParams,
  createActionColumn,
  createAppColumnHelper,
  useServerTable,
  type ListRow,
} from '@/features/table'

type ContractRow = ListRow<PaginatedMaintenanceContractList>

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
    cell: (info) => h(RouterLink, {
      to: {name: 'maintenance-contract-view', params: {pk: info.row.original.id}},
    }, () => info.getValue()),
  }),
  columnHelper.accessor((row) => row.customer_view?.name, {
    id: 'customer_view_name',
    header: $trans('Customer'),
  }),
  columnHelper.accessor('sum_tariffs', {
    header: $trans('Contract value'),
    cell: (info) => h('span', dineroFor(info.row.original).toFormat('$0.00')),
  }),
  columnHelper.accessor('remarks', {header: $trans('Remarks')}),
  columnHelper.accessor('created', {
    header: $trans('Created'),
    cell: (info) => h('small', info.getValue()),
  }),
  createActionColumn(columnHelper, {
    editRoute: 'maintenance-contract-edit',
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

type MaintenanceContractListQueryParams = NonNullable<CustomerMaintenanceContractListData['query']>

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<ContractRow>({
  key: 'maintenance-contract-table',
  columns,
  listOptions: (query) => customerMaintenanceContractListOptions({
    query: {
      ...baseListParams(query),
    } as MaintenanceContractListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading maintenance contracts'),
})
</script>

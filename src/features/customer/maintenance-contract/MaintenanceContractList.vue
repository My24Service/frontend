<template>
  <div class="app-page">
    <ListDeleteModal
      ref="deleteModalRef"
      modal-id="delete-maintenance-contract-modal"
      :confirm-text="$trans('Are you sure you want to delete this maintenance contract?')"
      :destroy-mutation="customerMaintenanceContractDestroyMutation"
      :invalidate="(queryClient) => queryClient.invalidateQueries({queryKey: customerMaintenanceContractListQueryKey()})"
      :deleted-detail="$trans('Maintenance contract has been deleted')"
      :delete-error="$trans('Error deleting maintenance contract')"
    />

    <ListPageHeader
      v-model:search-draft="searchDraft"
      :title="$trans('Maintenance contracts')"
      :search-label="$trans('Search maintenance contracts')"
      :refresh="refresh"
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
    </ListPageHeader>

    <div class="page-details panel">
      <ListTablePanel
        :table="table"
        :pagination="pagination"
        :count="count"
        :is-loading="isLoading"
        :is-fetching="isFetching"
        :empty-text="$trans('No maintenance contracts found')"
        :label="$trans('Contract')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  customerMaintenanceContractDestroyMutation,
  customerMaintenanceContractListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { CustomerMaintenanceContractListData, PaginatedMaintenanceContractList } from '@/api/types.gen'
import { tryToDinero } from './dinero-helpers'
import { useMainStore } from '@/stores/main'
import { $trans } from '@/services/i18n'
import { customerMaintenanceContractListQueryKey } from '@/api/@tanstack/vue-query.gen'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import ListPageHeader from '@/features/table/ListPageHeader.vue'
import ListTablePanel from '@/features/table/ListTablePanel.vue'
import ListDeleteModal from '@/features/table/ListDeleteModal.vue'
import { createActionColumn, type ListRow } from '@/features/table/list-columns'

type ContractRow = ListRow<PaginatedMaintenanceContractList>

const deleteModalRef = ref<InstanceType<typeof ListDeleteModal> | null>(null)

const mainStore = useMainStore()

function dineroFor(row: ContractRow) {
  return tryToDinero(row.sum_tariffs, mainStore.getDefaultCurrency)
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
    cell: (info) => {
      const dinero = dineroFor(info.row.original)
      return dinero ? h('span', dinero.toFormat('$0.00')) : ''
    },
  }),
  columnHelper.accessor('remarks', {header: $trans('Remarks')}),
  columnHelper.accessor('created', {
    header: $trans('Created'),
    cell: (info) => h('small', info.getValue()),
  }),
  createActionColumn(columnHelper, {
    editRoute: 'maintenance-contract-edit',
    onDelete: (id) => deleteModalRef.value?.showDeleteModal(id),
  }),
])

type MaintenanceContractListQueryParams = NonNullable<CustomerMaintenanceContractListData['query']>

const paged = useServerPagedList<ContractRow>({
  listOptions: (query) => customerMaintenanceContractListOptions({
    query: {
      ...baseListParams(query),
    } as MaintenanceContractListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading maintenance contracts'),
})

const table = useAppTable({
  key: 'maintenance-contract-table',
  columns,
  ...paged.tableOptions,
})

const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged
</script>

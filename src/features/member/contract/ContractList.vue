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
      :page-details="false"
      :title="$trans('Contracts')"
      :search-label="$trans('Search contracts')"
      :refresh="refresh"
      :empty-text="$trans('No contracts found')"
      :label="$trans('Contract')"
      :delete-modal="{
        modalId: 'delete-contract-modal',
        confirmText: $trans('Are you sure you want to delete this contract?'),
        destroyMutation: memberContractDestroyMutation,
        invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: memberContractListQueryKey()}),
        deletedDetail: $trans('Contract has been deleted'),
        deleteError: $trans('Error deleting contract'),
      }"
    >
      <template #add>
        <router-link
          :to="{name: 'contract-add'}"
          class="btn"
        >
          {{$trans('Add contract')}}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import {
  memberContractDestroyMutation,
  memberContractListOptions,
  memberContractListQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import type { MemberContractListData, PaginatedContractList } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import {
  ServerTable,
  baseListParams,
  createActionColumn,
  createAppColumnHelper,
  useServerTable,
  type ListRow,
} from '@/features/table'

type ContractRow = ListRow<PaginatedContractList>

// The screen's handle on the table: the icon column calls the delete modal
// through it, before this ref is populated. Typed structurally because
// ServerTable is generic over the row type.
const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const columnHelper = createAppColumnHelper<ContractRow>()

const columns = columnHelper.columns([
  columnHelper.accessor('name', {meta: {width: '20%'}, header: $trans('Name')}),
  // modules_text is Python-computed (get_modules_text) - no model column
  // behind it, so the backend allow-list cannot sort it.
  columnHelper.accessor('modules_text', {meta: {width: '50%'}, header: $trans('Modules'), enableSorting: false}),
  columnHelper.accessor('created', {meta: {width: '10%'}, header: $trans('Created')}),
  columnHelper.accessor('modified', {meta: {width: '10%'}, header: $trans('Modified')}),
  createActionColumn(columnHelper, {
    editRoute: 'contract-edit',
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

type ContractListQueryParams = NonNullable<MemberContractListData['query']>

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<ContractRow>({
  key: 'contract-table',
  columns,
  listOptions: (query) => memberContractListOptions({
    query: {
      ...baseListParams(query),
    } as ContractListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading contracts'),
})
</script>

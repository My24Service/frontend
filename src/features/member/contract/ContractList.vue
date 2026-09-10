<template>
  <div class="app-page">
    <ListDeleteModal
      ref="deleteModalRef"
      modal-id="delete-contract-modal"
      :confirm-text="$trans('Are you sure you want to delete this contract?')"
      :destroy-mutation="memberContractDestroyMutation"
      :invalidate="(queryClient) => queryClient.invalidateQueries({queryKey: memberContractListQueryKey()})"
      :deleted-detail="$trans('Contract has been deleted')"
      :delete-error="$trans('Error deleting contract')"
    />

    <ListPageHeader
      v-model:search-draft="searchDraft"
      :title="$trans('Contracts')"
      :search-label="$trans('Search contracts')"
      :refresh="refresh"
    >
      <template #add>
        <router-link
          :to="{name: 'contract-add'}"
          class="btn"
        >
          {{$trans('Add contract')}}
        </router-link>
      </template>
    </ListPageHeader>

    <ListTablePanel
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :empty-text="$trans('No contracts found')"
      :label="$trans('Contract')"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import {
  memberContractDestroyMutation,
  memberContractListOptions,
  memberContractListQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import type { MemberContractListData, PaginatedContractList } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import ListPageHeader from '@/features/table/ListPageHeader.vue'
import ListTablePanel from '@/features/table/ListTablePanel.vue'
import ListDeleteModal from '@/features/table/ListDeleteModal.vue'
import { createActionColumn, type ListRow } from '@/features/table/list-columns'

type ContractRow = ListRow<PaginatedContractList>

const deleteModalRef = ref<InstanceType<typeof ListDeleteModal> | null>(null)

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
    onDelete: (id) => deleteModalRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

type ContractListQueryParams = NonNullable<MemberContractListData['query']>

const paged = useServerPagedList<ContractRow>({
  listOptions: (query) => memberContractListOptions({
    query: {
      ...baseListParams(query),
    } as ContractListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading contracts'),
})

const table = useAppTable({
  key: 'contract-table',
  columns,
  ...paged.tableOptions,
})

const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged
</script>

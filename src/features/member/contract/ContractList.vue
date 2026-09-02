<template>
  <div class="app-page">
    <b-modal
      id="delete-contract-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok.prevent="handleDeleteOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this contract?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3>{{ $trans("Contracts") }}</h3>
        <BButton-toolbar>
          <BButton-group class="me-1">
            <ButtonLinkRefresh
              :method="refresh"
              :title="$trans('Refresh')"
            />
          </BButton-group>
          <input
            v-model="searchDraft"
            class="form-control form-control-sm w-auto me-2"
            :aria-label="$trans('Search contracts')"
            :placeholder="$trans('Search contracts')"
          />
          <router-link
            :to="{name: 'contract-add'}"
            class="btn"
          >
            {{$trans('Add contract')}}
          </router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class="app-detail panel overflow-auto">
      <div class="data-table">
        <ServerDataTable
          :table="table"
          :is-loading="isLoading"
          :empty-text="$trans('No contracts found')"
        />
      </div>
    </div>

    <ServerTablePagination
      v-if="!isLoading"
      :table="table"
      :pagination="pagination"
      :count="count"
      :label="$trans('Contract')"
      :is-fetching="isFetching"
    />
  </div>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import {
  memberContractDestroyMutation,
  memberContractListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { MemberContractListData, PaginatedContractList } from '@/api/types.gen'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import { $trans } from '@/utils'
import { memberContractListQueryKey } from '@/api/@tanstack/vue-query.gen'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { useServerPagedList } from '@/features/table/server-paged-list'
import { useListDelete } from '@/features/table/use-list-delete'
import ServerDataTable from '@/features/table/ServerDataTable.vue'
import ServerTablePagination from '@/features/table/ServerTablePagination.vue'

/**
 * See README/ADR for context.
 */


type ContractRow = NonNullable<PaginatedContractList['results']>[number]

const columnHelper = createAppColumnHelper<ContractRow>()

const columns = columnHelper.columns([
  columnHelper.accessor('name', {meta: {width: '20%'}, header: $trans('Name')}),
  // modules_text is Python-computed (get_modules_text) - no model column
  // behind it, so the backend allow-list cannot sort it.
  columnHelper.accessor('modules_text', {meta: {width: '50%'}, header: $trans('Modules'), enableSorting: false}),
  columnHelper.accessor('created', {meta: {width: '10%'}, header: $trans('Created')}),
  columnHelper.accessor('modified', {meta: {width: '10%'}, header: $trans('Modified')}),
  columnHelper.display({
    id: 'icons',
    header: '',
    meta: {width: '10%'},
    cell: (info) => h('div', {class: 'h2 float-end'}, [
      h(IconLinkEdit, {
        router_name: 'contract-edit',
        router_params: {pk: info.row.original.id},
        title: $trans('Edit'),
      }),
      h(IconLinkDelete, {
        title: $trans('Delete'),
        method: () => showDeleteModal(info.row.original.id),
      }),
    ]),
  }),
])

type ContractListQueryParams = NonNullable<MemberContractListData['query']>

const paged = useServerPagedList<ContractRow>({
  listOptions: (query) => memberContractListOptions({
    query: {
      page: query.page,
      page_size: query.page_size,
      ...(query.q ? {q: query.q} : {}),
      // The engine's ordering list rides the wire directly (the backend's
      // OrderingMixin allow-list).
      ...(query.ordering?.length ? {ordering: query.ordering} : {}),
    } as ContractListQueryParams,
  }),
  getRowId: (row: ContractRow) => String(row.id),
  loadError: $trans('Error loading contracts'),
})

const table = useAppTable({
  key: 'contract-table',
  columns,
  ...paged.tableOptions,
})

// Top-level refs so the template unwraps them.
const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged

const {deleteModal, showDeleteModal, handleDeleteOk} = useListDelete({
  destroyMutation: memberContractDestroyMutation,
  invalidateAfterDelete: (queryClient) => queryClient.invalidateQueries({queryKey: memberContractListQueryKey()}),
  copy: {
    deletedDetail: $trans('Contract has been deleted'),
    deleteError: $trans('Error deleting contract'),
  },
})
</script>

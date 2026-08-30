<template>
  <div class="app-page">
    <b-modal
      id="delete-contract-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this contract?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3>{{ $trans("Contracts") }} — TanStack Table PROTOTYPE</h3>
        <BButton-toolbar>
          <BButton-group class="mr-1">
            <ButtonLinkRefresh
              :method="refresh"
              :title="$trans('Refresh')"
            />
          </BButton-group>
          <input
            v-model="searchDraft"
            class="form-control form-control-sm w-auto mr-2"
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
          empty-text="No contracts found"
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
import { invalidateContractListQueries } from './list-invalidation'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { useServerPagedList } from '@/features/table/server-paged-list'
import { useListDelete } from '@/features/table/use-list-delete'
import ServerDataTable from '@/features/table/ServerDataTable.vue'
import ServerTablePagination from '@/features/table/ServerTablePagination.vue'

/**
 * PROTOTYPE — throwaway for the TanStack Table experiment, the Contract list
 * as a third Member data point. Mirrors the original screen's columns
 * exactly (name, modules_text, created, modified, icons), with the toolbar's
 * SearchModal replaced by the inline search input the other prototypes use.
 * Delete with the experiment.
 *
 * The backend's OrderingMixin gives the list real server-side sorting: the
 * engine's ordering list rides the wire (the original's b-table sorted the
 * loaded page locally). Derived columns that have no model column behind
 * them stay non-sortable.
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
    cell: (info) => h('div', {class: 'h2 float-right'}, [
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

const {deleteModal, showDeleteModal, doDelete} = useListDelete({
  destroyMutation: memberContractDestroyMutation,
  invalidateAfterDelete: (queryClient) => invalidateContractListQueries(queryClient),
  copy: {
    deletedDetail: $trans('Contract has been deleted'),
    deleteError: $trans('Error deleting contract'),
  },
})
</script>

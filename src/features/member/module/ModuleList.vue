<template>
  <div class="app-page">
    <b-modal
      id="delete-module-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this module?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3>{{ $trans("Modules") }}</h3>
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
            :aria-label="$trans('Search modules')"
            :placeholder="$trans('Search modules')"
          />
          <router-link
            :to="{name: 'module-add'}"
            class="btn"
          >
            {{$trans('Add module')}}
          </router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class="app-detail panel overflow-auto">
      <div class="data-table">
        <ServerDataTable
          :table="table"
          :is-loading="isLoading"
          empty-text="No modules found"
        />
      </div>
    </div>

    <ServerTablePagination
      v-if="!isLoading"
      :table="table"
      :pagination="pagination"
      :count="count"
      :label="$trans('Module')"
      :is-fetching="isFetching"
    />
  </div>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import {
  memberModuleDestroyMutation,
  memberModuleListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { MemberModuleListData, PaginatedModuleList } from '@/api/types.gen'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import { $trans } from '@/utils'
import { invalidateModuleListQueries } from './list-invalidation'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { useServerPagedList } from '@/features/table/server-paged-list'
import { useListDelete } from '@/features/table/use-list-delete'
import ServerDataTable from '@/features/table/ServerDataTable.vue'
import ServerTablePagination from '@/features/table/ServerTablePagination.vue'

/**
 * The Module list, on the shared server-paged TanStack Table kit. Keeps the
 * columns the previous b-table screen had (name, created, modified, icons);
 * that screen's toolbar lived inside the table's icons header (its styling
 * was never finished) — here it is the standard header the other list
 * screens use.
 *
 * The backend's OrderingMixin gives the list real server-side sorting: the
 * engine's ordering list rides the wire (the original's b-table sorted the
 * loaded page locally). Derived columns that have no model column behind
 * them stay non-sortable.
 */

type ModuleRow = NonNullable<PaginatedModuleList['results']>[number]

const columnHelper = createAppColumnHelper<ModuleRow>()

const columns = columnHelper.columns([
  columnHelper.accessor('name', {meta: {width: '70%'}, header: $trans('Name')}),
  columnHelper.accessor('created', {meta: {width: '10%'}, header: $trans('Created')}),
  columnHelper.accessor('modified', {meta: {width: '10%'}, header: $trans('Modified')}),
  columnHelper.display({
    id: 'icons',
    header: '',
    meta: {width: '10%'},
    cell: (info) => h('div', {class: 'h2 float-right'}, [
      h(IconLinkEdit, {
        router_name: 'module-edit',
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

type ModuleListQueryParams = NonNullable<MemberModuleListData['query']>

const paged = useServerPagedList<ModuleRow>({
  listOptions: (query) => memberModuleListOptions({
    query: {
      page: query.page,
      page_size: query.page_size,
      ...(query.q ? {q: query.q} : {}),
      // The engine's ordering list rides the wire directly (the backend's
      // OrderingMixin allow-list).
      ...(query.ordering?.length ? {ordering: query.ordering} : {}),
    } as ModuleListQueryParams,
  }),
  getRowId: (row: ModuleRow) => String(row.id),
  loadError: $trans('Error loading modules'),
})

const table = useAppTable({
  key: 'module-table',
  columns,
  ...paged.tableOptions,
})

// Top-level refs so the template unwraps them.
const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged

const {deleteModal, showDeleteModal, doDelete} = useListDelete({
  destroyMutation: memberModuleDestroyMutation,
  invalidateAfterDelete: (queryClient) => invalidateModuleListQueries(queryClient),
  copy: {
    deletedDetail: $trans('Module has been deleted'),
    deleteError: $trans('Error deleting module'),
  },
})
</script>

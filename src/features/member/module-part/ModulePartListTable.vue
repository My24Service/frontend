<template>
  <div class="app-page">
    <b-modal
      id="delete-module-part-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this module part?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3>{{ $trans("Module parts") }} — TanStack Table PROTOTYPE</h3>
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
            :aria-label="$trans('Search module parts')"
            :placeholder="$trans('Search module parts')"
          />
          <router-link
            :to="{name: 'module-part-add'}"
            class="btn"
          >
            {{$trans('Add module part')}}
          </router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class="app-detail panel overflow-auto">
      <div class="data-table">
        <ServerDataTable
          :table="table"
          :is-loading="isLoading"
          empty-text="No module parts found"
        />
      </div>
    </div>

    <ServerTablePagination
      v-if="!isLoading"
      :table="table"
      :pagination="pagination"
      :count="count"
      :label="$trans('Module part')"
      :is-fetching="isFetching"
    />
  </div>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import IBiCheckSquare from '~icons/bi/check-square'
import {
  memberModulePartDestroyMutation,
  memberModulePartListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { MemberModulePartListData, PaginatedModulePartList } from '@/api/types.gen'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import { $trans } from '@/utils'
import { invalidateModulePartListQueries } from './list-invalidation'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { useServerPagedList } from '@/features/table/server-paged-list'
import { useListDelete } from '@/features/table/use-list-delete'
import ServerDataTable from '@/features/table/ServerDataTable.vue'
import ServerTablePagination from '@/features/table/ServerTablePagination.vue'

/**
 * PROTOTYPE — throwaway for the TanStack Table experiment, the Module Part
 * list as a Member data point. Mirrors the original screen's columns exactly
 * (name, module_name, the always-selected checkmark, created, modified,
 * icons); the original's toolbar lived inside the table's icons header (its
 * styling was never finished) — here it is the standard header the other
 * prototypes use. Delete with the experiment.
 *
 * The backend's OrderingMixin gives the list real server-side sorting: the
 * engine's ordering list rides the wire (the original's b-table sorted the
 * loaded page locally). Derived columns that have no model column behind
 * them stay non-sortable.
 */

type ModulePartRow = NonNullable<PaginatedModulePartList['results']>[number]

const columnHelper = createAppColumnHelper<ModulePartRow>()

const columns = columnHelper.columns([
  columnHelper.accessor('name', {meta: {width: '30%'}, header: $trans('Name')}),
  columnHelper.accessor('module_name', {meta: {width: '20%'}, header: $trans('Module')}),
  columnHelper.accessor('is_always_selected', {
    meta: {width: '20%'},
    header: $trans('Always selected?'),
    // The legacy cell showed a checkmark icon (an auto-imported global
    // component a render function cannot reach) for true and nothing for
    // false; the icon imports directly here.
    cell: (info) => (info.getValue() ? h(IBiCheckSquare, {class: 'checkmark'}) : ''),
  }),
  columnHelper.accessor('created', {meta: {width: '10%'}, header: $trans('Created')}),
  columnHelper.accessor('modified', {meta: {width: '10%'}, header: $trans('Modified')}),
  columnHelper.display({
    id: 'icons',
    header: '',
    meta: {width: '10%'},
    cell: (info) => h('div', {class: 'h2 float-right'}, [
      h(IconLinkEdit, {
        router_name: 'module-part-edit',
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

type ModulePartListQueryParams = NonNullable<MemberModulePartListData['query']>

const paged = useServerPagedList<ModulePartRow>({
  listOptions: (query) => memberModulePartListOptions({
    query: {
      page: query.page,
      page_size: query.page_size,
      ...(query.q ? {q: query.q} : {}),
      // The engine's ordering list rides the wire directly (the backend's
      // OrderingMixin allow-list).
      ...(query.ordering?.length ? {ordering: query.ordering} : {}),
    } as ModulePartListQueryParams,
  }),
  getRowId: (row: ModulePartRow) => String(row.id),
  loadError: $trans('Error loading module parts'),
})

const table = useAppTable({
  key: 'module-part-table',
  columns,
  ...paged.tableOptions,
})

// Top-level refs so the template unwraps them.
const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged

const {deleteModal, showDeleteModal, doDelete} = useListDelete({
  destroyMutation: memberModulePartDestroyMutation,
  invalidateAfterDelete: (queryClient) => invalidateModulePartListQueries(queryClient),
  copy: {
    deletedDetail: $trans('Module part has been deleted'),
    deleteError: $trans('Error deleting module part'),
  },
})
</script>

<template>
  <div class="app-page">
    <b-modal
      id="delete-module-part-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok.prevent="handleDeleteOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this module part?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3>{{ $trans("Module parts") }}</h3>
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
          :empty-text="$trans('No module parts found')"
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
import { invalidateModulePartListQueries } from '../invalidation'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import { useListDelete } from '@/features/table/use-list-delete'
import ServerDataTable from '@/features/table/ServerDataTable.vue'
import ServerTablePagination from '@/features/table/ServerTablePagination.vue'

/**
 * The Module Part list, on the shared server-paged TanStack Table kit. The
 * backend's OrderingMixin gives the list real server-side sorting; derived
 * columns that have no model column behind them stay non-sortable.
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
    cell: (info) => h('div', {class: 'h2 float-end'}, [
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
      ...baseListParams(query),
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

const {deleteModal, showDeleteModal, handleDeleteOk} = useListDelete({
  destroyMutation: memberModulePartDestroyMutation,
  invalidateAfterDelete: (queryClient) => invalidateModulePartListQueries(queryClient),
  copy: {
    deletedDetail: $trans('Module part has been deleted'),
    deleteError: $trans('Error deleting module part'),
  },
})
</script>

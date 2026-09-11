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
      :title="$trans('Module parts')"
      :search-label="$trans('Search module parts')"
      :refresh="refresh"
      :empty-text="$trans('No module parts found')"
      :label="$trans('Module part')"
      :delete-modal="{
        modalId: 'delete-module-part-modal',
        confirmText: $trans('Are you sure you want to delete this module part?'),
        destroyMutation: memberModulePartDestroyMutation,
        invalidate: (queryClient) => invalidateModulePartListQueries(queryClient),
        deletedDetail: $trans('Module part has been deleted'),
        deleteError: $trans('Error deleting module part'),
      }"
    >
      <template #add>
        <router-link
          :to="{name: 'module-part-add'}"
          class="btn"
        >
          {{$trans('Add module part')}}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import { h, useTemplateRef } from 'vue'
import IBiCheckSquare from '~icons/bi/check-square'
import {
  memberModulePartDestroyMutation,
  memberModulePartListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { MemberModulePartListData, PaginatedModulePartList } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import { invalidateModulePartListQueries } from '../invalidation'
import ServerTable from '@/features/table/ServerTable.vue'
import { createAppColumnHelper } from '@/features/table/table'
import { baseListParams } from '@/features/table/server-paged-list'
import { useServerTable } from '@/features/table/use-server-table'
import { createActionColumn, type ListRow } from '@/features/table/list-columns'

type ModulePartRow = ListRow<PaginatedModulePartList>

// The screen's handle on the table: the icon column calls the delete modal
// through it, before this ref is populated. Typed structurally because
// ServerTable is generic over the row type.
const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

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
  createActionColumn(columnHelper, {
    editRoute: 'module-part-edit',
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

type ModulePartListQueryParams = NonNullable<MemberModulePartListData['query']>

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<ModulePartRow>({
  key: 'module-part-table',
  columns,
  listOptions: (query) => memberModulePartListOptions({
    query: {
      ...baseListParams(query),
    } as ModulePartListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading module parts'),
})
</script>

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
      :title="$trans('Modules')"
      :search-label="$trans('Search modules')"
      :refresh="refresh"
      :empty-text="$trans('No modules found')"
      :label="$trans('Module')"
      :delete-modal="{
        modalId: 'delete-module-modal',
        confirmText: $trans('Are you sure you want to delete this module?'),
        destroyMutation: memberModuleDestroyMutation,
        invalidate: (queryClient) => invalidateModuleListQueries(queryClient),
        deletedDetail: $trans('Module has been deleted'),
        deleteError: $trans('Error deleting module'),
      }"
    >
      <template #add>
        <router-link
          :to="{name: 'module-add'}"
          class="btn"
        >
          {{$trans('Add module')}}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue'
import {
  memberModuleDestroyMutation,
  memberModuleListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { MemberModuleListData, PaginatedModuleList } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import { invalidateModuleListQueries } from '../invalidation'
import ServerTable from '@/features/table/ServerTable.vue'
import { baseListParams, createAppColumnHelper, useServerTable } from '@/features/table/table'
import { createActionColumn, type ListRow } from '@/features/table/list-columns'

type ModuleRow = ListRow<PaginatedModuleList>

// The screen's handle on the table: the icon column calls the delete modal
// through it, before this ref is populated. Typed structurally because
// ServerTable is generic over the row type.
const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const columnHelper = createAppColumnHelper<ModuleRow>()

const columns = columnHelper.columns([
  columnHelper.accessor('name', {meta: {width: '70%'}, header: $trans('Name')}),
  columnHelper.accessor('created', {meta: {width: '10%'}, header: $trans('Created')}),
  columnHelper.accessor('modified', {meta: {width: '10%'}, header: $trans('Modified')}),
  createActionColumn(columnHelper, {
    editRoute: 'module-edit',
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

type ModuleListQueryParams = NonNullable<MemberModuleListData['query']>

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<ModuleRow>({
  key: 'module-table',
  columns,
  listOptions: (query) => memberModuleListOptions({
    query: {
      ...baseListParams(query),
    } as ModuleListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading modules'),
})
</script>

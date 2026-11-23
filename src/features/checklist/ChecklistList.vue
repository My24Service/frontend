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
      :title="$trans('Checklists')"
      :search-label="$trans('Search checklists')"
      :searchable="false"
      :refresh="refresh"
      :empty-text="$trans('No checklists found')"
      :label="$trans('Checklist')"
      :delete-modal="{
        modalId: 'delete-checklist-modal',
        confirmText: $trans('Are you sure you want to delete this checklist?'),
        resource: Api.ChecklistChecklist,
        invalidate: (queryClient) => invalidateChecklistQueries(queryClient),
        deletedDetail: $trans('Checklist has been deleted'),
        deleteError: $trans('Error deleting checklist'),
      }"
    >
      <template #add>
        <router-link
          :to="{name: 'settings-checklist-add'}"
          class="btn"
        >
          {{$trans('Add checklist')}}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import { invalidateChecklistQueries } from './invalidation'
import { ServerTable, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'

/**
 * The checklists an engineer fills in on an assigned order. The endpoint
 * declares neither a search nor an ordering, so the table offers neither.
 */
type ChecklistRow = ListRow<Api.PaginatedChecklistList>

// The screen's handle on the table: the icon column calls the delete modal
// through it, before this ref is populated. Typed structurally because
// ServerTable is generic over the row type.
const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const columnHelper = createAppColumnHelper<ChecklistRow>()

const columns = columnHelper.columns([
  columnHelper.accessor('name', {
    header: $trans('Name'),
    enableSorting: false,
    meta: {width: '90%'},
  }),
  createActionColumn(columnHelper, {
    editRoute: 'settings-checklist-edit',
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<ChecklistRow>({
  key: 'checklist-table',
  columns,
  resource: Api.ChecklistChecklist,
  urlSync: true,
  loadError: $trans('Error loading checklists'),
})
</script>

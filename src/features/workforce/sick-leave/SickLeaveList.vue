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
      :title="$trans('Sick leave')"
      :search-label="$trans('Search sick leave')"
      :label="$trans('Sick leave')"
      :empty-text="$trans('No sick leave found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-sick-leave-modal',
        confirmText: $trans('Are you sure you want to delete this sick leave?'),
        destroyMutation: companyUserSickLeaveAdminDestroyMutation,
        invalidate: invalidateReads(companyUserSickLeaveAdmin),
        deletedDetail: $trans('Sick leave has been deleted'),
        deleteError: $trans('Error deleting sick leave'),
      }"
    >
      <template #subnav><SubNav /></template>
      <template #icon><IBiFileEarmarkCheckFill /></template>
      <template #add>
        <router-link
          :to="{name: 'sick-leave-list-add'}"
          class="btn btn-primary"
        >{{ $trans('Add sick leave') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import {
  companyUserSickLeaveAdminDestroyMutation,
  companyUserSickLeaveAdminListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedUserSickLeaveList } from '@/api/types.gen'
import { companyUserSickLeaveAdmin } from '@/api/resources.gen'
import { invalidateReads } from '@/features/forms'
import { ServerTable, baseListParams, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import SubNav from '../SubNav.vue'

/**
 * The tenant's sick leave, the admin list `/api/company/user-sick-leave/admin/`.
 *
 * Two defects go with the port. The legacy delete action threw: its
 * `showDeleteModal()` read a bare `id` it was never passed (the template handed
 * the row id to a method that declared no parameter), so the confirmation never
 * opened and no sick leave could be deleted at all - the kit's row action
 * passes the id. And the legacy `cell(full_name)` template was dead: the
 * column's field is `user_full_name`, so the cell never rendered and the user's
 * name was never the link to `leave-edit` it appeared to be. The row's edit
 * action is the sick-leave editor, which is what the screen means.
 */
type SickLeaveRow = ListRow<PaginatedUserSickLeaveList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')
const helper = createAppColumnHelper<SickLeaveRow>()

/** The legacy cell: the start date alone, or a range once the leave is closed. */
function renderDate(row: SickLeaveRow): string {
  if (!row.end_date) return `${row.start_date ?? ''}`
  return `${row.start_date ?? ''} - ${row.end_date}`
}

const columns = helper.columns([
  helper.accessor('user_full_name', {
    header: $trans('User'),
  }),
  helper.display({
    id: 'date',
    header: $trans('Date'),
    enableSorting: false,
    cell: ({row}) => renderDate(row.original),
  }),
  helper.accessor('created_by_fullname', {
    header: $trans('Created by'),
  }),
  helper.accessor('created', {
    header: $trans('Created'),
  }),
  helper.accessor('last_status_full', {
    header: $trans('Status'),
  }),
  createActionColumn(helper, {
    editRoute: 'sick-leave-list-edit',
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<SickLeaveRow>({
  key: 'sick-leave-table',
  columns,
  enableSorting: false,
  listOptions: (query) => companyUserSickLeaveAdminListOptions({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading sick leave request'),
})
</script>

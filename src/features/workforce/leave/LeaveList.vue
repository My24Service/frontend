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
      :title="$trans('Leave')"
      :search-label="$trans('Search leave')"
      :label="$trans('Leave')"
      :empty-text="$trans('No leave found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-leave-modal',
        confirmText: $trans('Are you sure you want to delete this leave?'),
        resource: Api.CompanyUserLeaveHoursAdmin,
        deletedDetail: $trans('Leave has been deleted'),
        deleteError: $trans('Error deleting leave'),
      }"
    >
      <template #subnav><SubNav /></template>
      <template #icon><IBiFileEarmarkCheckFill /></template>
      <template #add>
        <router-link
          :to="{name: 'leave-list-add'}"
          class="btn btn-primary"
        >{{ $trans('Add leave') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { ServerTable, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import SubNav from '../SubNav.vue'

/**
 * Every leave in the tenant, the admin list `/api/company/user-leave-hours/admin/`.
 *
 * The legacy screen's columns, its add and edit routes, its delete modal id and
 * its toast copy are unchanged. What the kit brings is the header, the search
 * box, the pagination and the confirmation - and the endpoint declares no
 * `ordering`, so no column is sortable rather than rendering a control nothing
 * honours.
 */
type LeaveRow = ListRow<Api.PaginatedUserLeaveHoursList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')
const helper = createAppColumnHelper<LeaveRow>()

/**
 * "01-02-2026 / 8:0" for a one-day leave, "01-02-2026 - 05-02-2026 / 8:0" for a
 * longer one - the legacy cell's own rendering, hours and minutes side by side
 * and unpadded.
 */
function renderDate(row: LeaveRow): string {
  const clock = `${row.total_hours ?? 0}:${row.total_minutes ?? 0}`
  if (row.start_date === row.end_date) return `${row.start_date} / ${clock}`
  return `${row.start_date} - ${row.end_date} / ${clock}`
}

const columns = helper.columns([
  helper.accessor('full_name', {
    header: $trans('User'),
    cell: ({row}) => h(RouterLink, {
      class: 'px-1',
      to: {name: 'leave-edit', params: {pk: row.original.id}},
    }, () => row.original.full_name),
  }),
  helper.display({
    id: 'date',
    header: $trans('Date/hours'),
    enableSorting: false,
    cell: ({row}) => renderDate(row.original),
  }),
  helper.accessor('leave_type_name', {
    header: $trans('Leave type'),
  }),
  helper.accessor('last_status_full', {
    header: $trans('Status'),
  }),
  createActionColumn(helper, {
    editRoute: 'leave-edit',
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<LeaveRow>({
  key: 'leave-table',
  columns,
  enableSorting: false,
  resource: Api.CompanyUserLeaveHoursAdmin,
  urlSync: true,
  loadError: $trans('Error loading leave requests'),
})
</script>

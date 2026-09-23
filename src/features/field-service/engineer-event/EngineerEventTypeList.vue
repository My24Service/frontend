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
      :title="$trans('Event types')"
      :search-label="$trans('Search event types')"
      :label="$trans('Event type')"
      :refresh="refresh"
      :empty-text="$trans('No event types found')"
      :delete-modal="{
        modalId: 'delete-event-type-modal',
        confirmText: $trans('Are you sure you want to delete this event type?'),
        destroyMutation: companyEngineerEventTypeDestroyMutation,
        invalidate: invalidateReads(companyEngineerEventType),
        deletedDetail: $trans('Event type has been deleted'),
        deleteError: $trans('Error deleting event type'),
      }"
    >
      <template #subnav><EngineerPills /></template>
      <template #icon><IBiFileEarmarkCheckFill /></template>
      <template #add>
        <router-link :to="{name: 'engineer-event-type-add'}" class="btn btn-primary">
          <IBiFileEarmarkPlus />{{ $trans('New event type') }}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import {
  companyEngineerEventTypeDestroyMutation,
  companyEngineerEventTypeListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedEngineerEventTypeList } from '@/api/types.gen'
import { companyEngineerEventType } from '@/api/resources.gen'
import { invalidateReads } from '@/features/forms'
import {
  ServerTable,
  baseListParams,
  createActionColumn,
  createAppColumnHelper,
  useServerTable,
  type ListRow,
} from '@/features/table'

import EngineerPills from './EngineerPills.vue'

/**
 * The tenant's engineer-event types: the codes a door event can carry, and
 * what each one means for the engineer's "last event" reading.
 *
 * The table kit's header carries what the legacy toolbar did — the add link,
 * the refresh button and the search field — and the search rides `q`, which
 * the endpoint declares. Sorting is off: the legacy headers set `sortable`
 * on five columns, but `EngineerEventTypeViewset` declares no `ordering`
 * allow-list, so the sort only ever reordered the rows a page already held.
 */
type EventTypeRow = ListRow<PaginatedEngineerEventTypeList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const columnHelper = createAppColumnHelper<EventTypeRow>()

const columns = columnHelper.columns([
  columnHelper.accessor('event_type', {
    header: $trans('Event type'),
    enableSorting: false,
  }),
  columnHelper.accessor('measure_last_event_type', {
    header: $trans('Measure last event type'),
    enableSorting: false,
  }),
  columnHelper.display({
    id: 'statuscode_view.statuscode',
    header: $trans('Status'),
    cell: (info) => info.row.original.statuscode_view?.statuscode ?? '',
  }),
  columnHelper.accessor('created', {
    header: $trans('Created'),
    enableSorting: false,
  }),
  columnHelper.accessor('modified', {
    header: $trans('Modified'),
    enableSorting: false,
  }),
  createActionColumn(columnHelper, {
    editRoute: 'engineer-event-type-edit',
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<EventTypeRow>({
  key: 'engineer-event-type-table',
  columns,
  enableSorting: false,
  listOptions: (query) => companyEngineerEventTypeListOptions({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading event types'),
})
</script>

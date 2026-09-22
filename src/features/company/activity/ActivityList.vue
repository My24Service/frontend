<template>
  <div class="app-page">
    <ServerTable
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :title="$trans('Activity')"
      :search-label="$trans('Search activity')"
      :label="$trans('Activity')"
      :empty-text="$trans('No activity found')"
      :refresh="refresh"
    >
      <template #icon><IBiReceiptCutoff /></template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { companyActivityListOptions } from '@/api/@tanstack/vue-query.gen'
import type { PaginatedActivityList } from '@/api/types.gen'
import { ServerTable, baseListParams, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
/**
 * The activity log: a read-only, server-paged list. No form, no row actions -
 * the legacy screen's icons column was empty - so no delete modal and no
 * `invalidation.ts` entry: nothing here writes.
 */
type ActivityRow = ListRow<PaginatedActivityList>

const helper = createAppColumnHelper<ActivityRow>()

const columns = helper.columns([
  helper.accessor('text', {
    header: $trans('Activity'),
  }),
  helper.accessor('created', {
    header: $trans('Date'),
    cell: ({ row }) => h('small', row.original.created),
  }),
])

const { table, searchDraft, pagination, count, isLoading, isFetching, refresh } = useServerTable<ActivityRow>({
  key: 'activity-table',
  columns,
  listOptions: (query) => companyActivityListOptions({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading activity'),
})
</script>

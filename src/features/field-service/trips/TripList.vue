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
      :title="$trans('Trips')"
      :search-label="$trans('Search trips')"
      :label="$trans('Trip')"
      :empty-text="$trans('No trips found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-trip-modal',
        confirmText: $trans('Are you sure you want to delete this trip?'),
        resource: Api.MobileTrip,
        deletedDetail: $trans('Trip has been deleted'),
        deleteError: $trans('Error deleting trip'),
      }"
    >
      <template #add>
        <router-link
          :to="{name: 'mobile-trips-add'}"
          class="btn"
        >{{ $trans('New trip') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { ServerTable, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
type TripRow = ListRow<Api.PaginatedTripList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const helper = createAppColumnHelper<TripRow>()

const columns = helper.columns([
  helper.accessor('trip_date', {header: $trans('Date')}),
  helper.accessor('last_status', {header: $trans('Status')}),
  helper.accessor('description', {header: $trans('Description')}),
  helper.accessor('required_users', {header: $trans('Required users')}),
  helper.accessor('num_orders', {header: $trans('# orders')}),
  createActionColumn(helper, {
    editRoute: 'mobile-trips-edit',
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<TripRow>({
  key: 'trip-table',
  columns,
  // The endpoint declares no `ordering` parameter, and the legacy table's
  // sortable headers sorted the rows it already held. The kit's sort state is
  // therefore never forwarded, and the headers offer no sort.
  enableSorting: false,
  resource: Api.MobileTrip,
  urlSync: true,
  loadError: $trans('Error loading trips'),
})
</script>

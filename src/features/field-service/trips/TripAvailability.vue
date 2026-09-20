<template>
  <div class="app-page">
    <ServerTable
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :title="$trans('Trip availability')"
      :search-label="$trans('Search trips')"
      :label="$trans('Trip')"
      :empty-text="$trans('No trips found')"
      :refresh="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { Fragment } from 'vue'
import { RouterLink } from 'vue-router'
import { mobileTripListOptions } from '@/api/@tanstack/vue-query.gen'
import type { PaginatedTripList } from '@/api/types.gen'
import {
  ServerTable,
  baseListParams,
  createAppColumnHelper,
  useServerTable,
  type ListRow,
} from '@/features/table'
import { $trans } from '@/services/i18n'

/**
 * Who can be put on a trip, read as the trip collection.
 *
 * The legacy screen imports the **Trip** model (`@/models/mobile/Trip.js`),
 * not `TripAvailability.js`, so its rows are trips from
 * `/api/mobile/trip/` and its three counts are the ones the trip serializer
 * derives for them. That read is what this screen keeps.
 */
type TripRow = ListRow<PaginatedTripList>

const helper = createAppColumnHelper<TripRow>()

const columns = helper.columns([
  helper.display({
    id: 'trip',
    header: $trans('Trip'),
    // One `Fragment`, not an array: a cell renderer's value is rendered as a
    // single root, and an array comes out as an empty comment.
    cell: ({row}) => h(Fragment, null, [
      h('b', $trans('Trip')), ': ',
      h(RouterLink, {
        class: 'px-1',
        to: {name: 'mobile-trip-availability-detail', params: {pk: row.original.id}},
      }, () => `${$trans('trip')}-${row.original.id}`),
      h('br'),
      h('b', $trans('Description')), ': ', row.original.description ?? '',
      h('br'),
      h('b', $trans('Date')), ': ', row.original.trip_date,
    ]),
  }),
  helper.accessor('required_users', {header: $trans('Required users')}),
  helper.accessor('users_trip_set_as_available', {header: $trans('Available users')}),
  helper.accessor('assigned_user_count', {header: $trans('Assigned users')}),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<TripRow>({
  key: 'trip-availability-table',
  columns,
  // The three count columns were sortable in the legacy b-table, which sorted
  // the rows it held; the endpoint declares no `ordering`, so no sort is
  // forwarded and the headers offer none.
  enableSorting: false,
  listOptions: (query) => mobileTripListOptions({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading trips'),
})
</script>

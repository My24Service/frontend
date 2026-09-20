<template>
  <div class="app-page">
    <ServerTable
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :title="$trans('Assigned finished')"
      :search-label="$trans('Search')"
      :label="$trans('Order')"
      :refresh="refresh"
      :empty-text="$trans('No assigned orders found')"
    >
      <template #icon><IBiCheck2All></IBiCheck2All></template>
      <template #toolbar-extra>
        <BLink class="px-1" @click.prevent="backMonth" v-bind:title="$trans('Month back')">
          <IBiArrowLeft font-scale="1.8"></IBiArrowLeft>
        </BLink>
        <span class="month-label">{{ monthText }} {{ year }}</span>
        <BLink class="px-1" @click.prevent="nextMonth" v-bind:title="$trans('Next month') ">
          <IBiArrowRight font-scale="1.8"></IBiArrowRight>
        </BLink>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import moment from 'moment/min/moment-with-locales'
import { RouterLink } from 'vue-router'

import { mobileAssignedorderFinishedListListOptions } from '@/api/@tanstack/vue-query.gen'
import type { MobileAssignedorderFinishedListListData, PaginatedAssignedOrderViewList } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import {
  ServerTable,
  baseListParams,
  createAppColumnHelper,
  useServerTable,
  type ListRow,
} from '@/features/table'

type FinishedRow = ListRow<PaginatedAssignedOrderViewList>

/**
 * The orders that were worked and finished, month by month.
 *
 * The month is the endpoint's own window: `finished_list` filters the order's
 * `start_date` by `year` and `month` (my24service
 * `apps/mobile/views.py:251-259`), defaulting to the current one. Those two
 * parameters are **not** in openapi/schema.yaml, so the generated data type says
 * `query?: never` and the request carries them through a cast — see the slice
 * README. The month is only named once the planner has moved it, so the default
 * view asks the endpoint the same question the legacy screen asked.
 */
const store = useMainStore()

moment.locale(store.getCurrentLanguage || 'nl')

/** How many months the board has been moved from this one. */
const monthOffset = ref(0)
const month = computed(() => moment().add(monthOffset.value, 'month'))

const monthText = computed(() => month.value.format('MMM'))
const year = computed(() => month.value.year())

function nextMonth() {
  monthOffset.value += 1
}

function backMonth() {
  monthOffset.value -= 1
}

const columnHelper = createAppColumnHelper<FinishedRow>()

const columns = columnHelper.columns([
  columnHelper.display({
    id: 'order',
    header: $trans('Order'),
    cell: ({row}) => h(RouterLink, {
      class: 'px-1',
      to: {name: 'order-view', params: {pk: row.original.order.id}},
    }, () => [
      row.original.order.order_name,
      h('br'),
      row.original.order.order_city,
    ]),
  }),
  columnHelper.display({
    id: 'engineer',
    header: $trans('Engineer'),
    cell: ({row}) => {
      const user = row.original.engineer?.user
      return user ? `${user.first_name} ${user.last_name}` : ''
    },
  }),
  columnHelper.accessor('started', {header: $trans('Started')}),
  columnHelper.accessor('ended', {header: $trans('Ended')}),
  columnHelper.display({
    id: 'work_total',
    header: $trans('Work hours'),
    cell: ({row}) => row.original.activity_totals.work_total,
  }),
  columnHelper.display({
    id: 'travel_to_total',
    header: $trans('Travel to'),
    cell: ({row}) => row.original.activity_totals.travel_to_total,
  }),
  columnHelper.display({
    id: 'travel_back_total',
    header: $trans('Travel back'),
    cell: ({row}) => row.original.activity_totals.travel_back_total,
  }),
  columnHelper.display({
    id: 'distance_to_total',
    header: $trans('Distance to'),
    cell: ({row}) => row.original.activity_totals.distance_to_total,
  }),
  columnHelper.display({
    id: 'distance_back_total',
    header: $trans('Distance back'),
    cell: ({row}) => row.original.activity_totals.distance_back_total,
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<FinishedRow>({
  key: 'assigned-finished-table',
  columns,
  // The endpoint declares no `ordering`, so the kit's sort state is never
  // forwarded: an undeclared parameter is not sent.
  enableSorting: false,
  listOptions: (query) => mobileAssignedorderFinishedListListOptions({
    query: {
      ...baseListParams(query),
      ...(monthOffset.value === 0 ? {} : {month: month.value.format('M'), year: year.value}),
    } as unknown as NonNullable<MobileAssignedorderFinishedListListData['query']>,
  }),
  urlSync: true,
  loadError: $trans('Error loading orders'),
})
</script>

<style scoped>
.month-label {
  white-space: nowrap;
  align-self: center;
}
</style>

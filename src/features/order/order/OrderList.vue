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
      :title="$trans('Orders')"
      :search-label="$trans('Search orders')"
      :refresh="reload"
      :empty-text="$trans('No orders found')"
      :label="$trans('Order')"
      :delete-modal="{
        modalId: 'delete-order-modal',
        confirmText: $trans('Are you sure you want to delete this order?'),
        destroyMutation: () => orderOrderDestroyMutation(),
        invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: listQueryKeyFor(mode)}),
        deletedDetail: $trans('Order has been deleted'),
        deleteError: $trans('Error deleting order'),
      }"
    >
      <template #icon><IBiFileEarmarkText></IBiFileEarmarkText></template>
      <template #add>
        <router-link
          v-if="!isMobile"
          :to="{name: 'order-add'}"
          class="btn btn-primary"
        >
          <IBiFileEarmarkPlus></IBiFileEarmarkPlus> {{ $trans('Add order') }}
        </router-link>
      </template>
      <template #subnav>
        <div class="order-filter-links">
          <b-nav pills>
            <b-nav-item
              :active="isAllActive"
              :to="{name: isMobile ? 'mobile-orders' : 'order-list'}"
            >
              {{ $trans('All') }}
            </b-nav-item>
            <b-nav-item
              v-if="!isMobile"
              :active="mode === 'unaccepted' && !activeUserFilter"
              :to="{name: 'orders-not-accepted'}"
            >
              {{ $trans('Not accepted') }}
            </b-nav-item>
            <b-nav-item
              v-for="filter in userFilters"
              :key="filter.id"
              :active="filter.id === activeUserFilter"
              :aria-label="`${$trans('Filter')} ${filter.name}`"
              @click.prevent="toggleUserFilter(filter.id)"
            >
              {{ filter.name }}
            </b-nav-item>
          </b-nav>
        </div>

        <div v-if="canAssign && selectedOrders.length > 0" class="selected-orders">
          <span class="dimmed">{{ $trans('Selected orders') }} ({{ selectedOrders.length }}):</span>
          <span
            v-for="(order, index) in selectedOrders"
            :key="order.id"
            class="selected-order"
          >
            {{ order.order_id }}
            <IBiXCircle class="icon" @click.prevent="removeSelectedOrder(index)"></IBiXCircle>
            <IBiXCircleFill class="icon" @click.prevent="removeSelectedOrder(index)"></IBiXCircleFill>
          </span>
          <BButton variant="primary" size="sm" @click.prevent="assignSelected">
            <IBiPersonLinesFill></IBiPersonLinesFill>
            {{ $trans('Assign these orders') }}
          </BButton>
        </div>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, ref, useTemplateRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'

import { orderFilterSimpleListListOptions, orderOrderDestroyMutation } from '@/api/@tanstack/vue-query.gen'
import type { Order, OrderOrderListData, PaginatedOrderList, Statuscode } from '@/api/types.gen'
import IconLinkAssign from '@/components/IconLinkAssign.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import IBiClock from '~icons/bi/clock'
import { NEW_DATA_EVENTS, NEW_DATA_EVENTS_TYPES } from '@/constants'
import { useAuthStore } from '@/features/auth'
import { useMainStore } from '@/stores/main'
import { $trans } from '@/services/i18n'
import {
  ServerTable,
  baseListParams,
  createAppColumnHelper,
  useServerTable,
  type ListRow,
} from '@/features/table'
import { useMemberNewData } from '../use-member-new-data'
import { isListMode, listOptionsFor, listQueryKeyFor, type ListMode, type OrderListQuery } from './list-modes'
import OrderStatusCell from './OrderStatusCell.vue'
import { useUnacceptedCount } from './use-unaccepted-count'

type OrderRow = ListRow<PaginatedOrderList>

const props = withDefaults(defineProps<{
  /** The mobile dispatch lists: rows can be picked and handed to the dispatch screen. */
  dispatch?: boolean
  queryMode?: string
}>(), {
  dispatch: false,
  queryMode: 'all',
})

const mode = computed<ListMode>(() => (isListMode(props.queryMode) ? props.queryMode : 'all'))

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const mainStore = useMainStore()

const isMobile = computed(() => route.path.startsWith('/mobile'))
const isCustomer = computed(() => authStore.isCustomer)
const isBranchEmployee = computed(() => authStore.isBranchEmployee)
const canDelete = computed(() => !isCustomer.value && !isBranchEmployee.value)
const canAssign = computed(() => props.dispatch && canDelete.value)

const statuscodes = computed<Statuscode[]>(() => mainStore.getStatuscodes ?? [])
const orderTypes = computed<string[]>(() => mainStore.getOrderTypes ?? [])
const includeReference = computed<boolean>(() => !!mainStore.getOrderListMustIncludeReference)

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

// The saved filters (`/order/filter/`) are the legacy way of narrowing this
// list, kept as pills. Picking one sets a `user_filter` column filter on the
// kit — a filter without a column, which the kit still commits, mirrors
// into the address and hands to `listOptions` — and this screen forwards it
// on the wire. The screens that edit them are not this Slice's.
const userFiltersQuery = useQuery(orderFilterSimpleListListOptions())
const userFilters = computed(() => userFiltersQuery.data.value ?? [])

const columnHelper = createAppColumnHelper<OrderRow>()

function orderLink(row: OrderRow, children: () => unknown) {
  return h(RouterLink, {to: {name: 'order-view', params: {pk: row.id}}}, children)
}

function assignedUsers(row: OrderRow): string[] {
  return (row.assigned_user_info ?? []).map((user) => (
    user.license_plate ? `${user.full_name} (${user.license_plate})` : user.full_name
  ))
}

function selectOptions(values: string[]) {
  return values.map((value) => ({value, label: value}))
}

const columns = columnHelper.columns([
  columnHelper.accessor('order_id', {
    header: $trans('order id'),
    enableColumnFilter: true,
    meta: {filterVariant: 'text'},
    cell: (info) => {
      const row = info.row.original
      const reference = includeReference.value && row.order_reference ? ` / ${row.order_reference}` : ''
      return orderLink(row, () => `#${row.order_id}${reference}`)
    },
  }),
  columnHelper.accessor('order_name', {
    header: $trans('company'),
    enableColumnFilter: true,
    meta: {filterVariant: 'text'},
  }),
  columnHelper.accessor('order_type', {
    header: $trans('type'),
    enableColumnFilter: true,
    meta: {filterVariant: 'select', selectOptions: selectOptions(orderTypes.value)},
    cell: (info) => orderLink(info.row.original, () => h('strong', info.getValue() ?? '')),
  }),
  columnHelper.display({
    id: 'assignees',
    header: $trans('people'),
    cell: (info) => {
      const names = assignedUsers(info.row.original)
      return names.length
        ? h('span', {title: `assignees: ${names.join(', ')}`}, [h('strong', names.join(', '))])
        : h('span', {title: $trans('Not assigned to anyone')}, '–')
    },
  }),
  columnHelper.accessor('last_status', {
    header: $trans('status'),
    enableColumnFilter: true,
    enableSorting: false,
    meta: {filterVariant: 'select', selectOptions: selectOptions(statuscodes.value.map((code) => code.statuscode))},
    cell: (info) => h(OrderStatusCell, {
      order: info.row.original,
      statuscodes: statuscodes.value,
      onChanged: () => reload(),
    }),
  }),
  columnHelper.accessor('start_date', {
    header: $trans('start date'),
    enableColumnFilter: true,
    meta: {filterVariant: 'text', filterPlaceholder: '2026-03 or 2026-03-01...2026-03-31'},
    cell: (info) => {
      const row = info.row.original
      const time = row.start_time ? ` ${row.start_time}` : ''
      return h('span', {title: `${row.start_date}${time}`}, [
        row.start_date,
        row.start_time ? h('b', {title: row.start_time}, [' ', h(IBiClock)]) : null,
      ])
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: '',
    cell: (info) => {
      const row = info.row.original
      return h('div', {class: 'orders-table-actions'}, [
        canAssign.value
          ? h(IconLinkAssign, {title: $trans('Assign'), method: () => selectOrder(row)})
          : null,
        canDelete.value
          ? h(IconLinkDelete, {title: $trans('Delete'), method: () => tableRef.value?.showDeleteModal(row.id)})
          : null,
      ])
    },
  }),
])

function stringParam(value: unknown): string | undefined {
  return value == null || value === '' ? undefined : String(value)
}

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh, columnFilters} = useServerTable<OrderRow>({
  key: 'order-table',
  columns,
  listOptions: (query) => {
    const userFilter = Number(query.user_filter)
    return listOptionsFor(
      mode.value,
      {
        ...(baseListParams(query) as OrderListQuery),
        ...(stringParam(query.order_id) ? {order_id: stringParam(query.order_id)} : {}),
        ...(stringParam(query.order_name) ? {order_name: stringParam(query.order_name)} : {}),
        ...(stringParam(query.order_type) ? {order_type: stringParam(query.order_type)} : {}),
        ...(stringParam(query.last_status) ? {last_status: stringParam(query.last_status)} : {}),
        // the column is the row's start_date; the filter is the action's `start`
        ...(stringParam(query.start_date) ? {start: stringParam(query.start_date)} : {}),
      },
      // Only the plain list takes a saved filter; the other modes drop it.
      Number.isInteger(userFilter) && userFilter > 0 ? {user_filter: userFilter} : {},
    )
  },
  urlSync: true,
  loadError: $trans('Error loading orders'),
})

const unaccepted = useUnacceptedCount()

function reload() {
  refresh()
  unaccepted.refetch()
}

// --- the saved-filter pills -------------------------------------------------

const USER_FILTER = 'user_filter'

const activeUserFilter = computed(() => {
  const filter = columnFilters.value.find((entry) => entry.id === USER_FILTER)
  const value = Number(filter?.value)
  return Number.isInteger(value) && value > 0 ? value : null
})

const isAllActive = computed(() => mode.value === 'all' && !activeUserFilter.value)

function toggleUserFilter(id: number) {
  const next = activeUserFilter.value === id ? null : id
  columnFilters.value = [
    ...columnFilters.value.filter((entry) => entry.id !== USER_FILTER),
    ...(next ? [{id: USER_FILTER, value: String(next)}] : []),
  ]
}

// --- the dispatch selection -------------------------------------------------

const selectedOrders = ref<Array<Pick<Order, 'id' | 'order_id'>>>(
  Array.isArray(mainStore.getAssignOrders) ? [...mainStore.getAssignOrders] : [],
)

watch(selectedOrders, (orders) => mainStore.setAssignOrders(orders), {deep: true})

function selectOrder(order: OrderRow) {
  if (selectedOrders.value.some((selected) => selected.id === order.id)) return
  selectedOrders.value = [...selectedOrders.value, {id: order.id, order_id: order.order_id}]
}

function removeSelectedOrder(index: number) {
  selectedOrders.value = selectedOrders.value.filter((_order, i) => i !== index)
}

function assignSelected() {
  mainStore.setAssignOrders(selectedOrders.value)
  // `/mobile/dispatch/:assignModeProp?` — the dispatch screen JSON.parses the segment.
  router.push({name: 'mobile-dispatch', params: {assignModeProp: 'true'}})
}

// --- live updates -----------------------------------------------------------

useMemberNewData(NEW_DATA_EVENTS.UNACCEPTED_ORDER, (message) => {
  if (message.type !== NEW_DATA_EVENTS.UNACCEPTED_ORDER) return
  if (
    message.data_type === NEW_DATA_EVENTS_TYPES.NEW_DATA_ORDER_ACCEPTED
    || message.data_type === NEW_DATA_EVENTS_TYPES.NEW_DATA_ORDER_REJECTED
  ) {
    reload()
  }
})
</script>

<style scoped>
.order-filter-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1ex 2ex;
}
.selected-orders {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1ex;
  margin-top: 1ex;
}
.selected-order .icon { cursor: pointer; }
.selected-order:not(:hover) .icon:last-of-type,
.selected-order:hover .icon:first-of-type { display: none; }
</style>

<style>
.orders-table-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: .25rem;
  white-space: nowrap;
}
</style>

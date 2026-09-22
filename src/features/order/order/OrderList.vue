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
        invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: orderOrderListQueryKey()}),
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
import { orderOrderDestroyMutation, orderOrderListQueryKey } from '@/api/@tanstack/vue-query.gen'
import { NEW_DATA_EVENTS, NEW_DATA_EVENTS_TYPES } from '@/constants'
import { useAuthStore } from '@/features/auth'
import { ServerTable, useServerTable } from '@/features/table'
import { $trans } from '@/services/i18n'
import { useMemberNewData } from '../use-member-new-data'
import { isListMode, listOptionsFor, listQueryFrom, userFilterFrom, type ListMode } from './list-modes'
import { useDispatchSelection } from './use-dispatch-selection'
import { useOrderColumns, type OrderRow } from './use-order-columns'
import { useSavedFilterPills } from './use-saved-filter-pills'
import { useUnacceptedCount } from './use-unaccepted-count'

/**
 * The order list: one screen for the five list modes (see ./list-modes.ts),
 * with the saved-filter pills, and on the mobile dispatch lists a pick of
 * rows to hand to the dispatch screen.
 */
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
const authStore = useAuthStore()

const isMobile = computed(() => route.path.startsWith('/mobile'))
const canDelete = computed(() => !authStore.isCustomer && !authStore.isBranchEmployee)
const canAssign = computed(() => props.dispatch && canDelete.value)

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const {selected: selectedOrders, select: selectOrder, remove: removeSelectedOrder, assign: assignSelected} = useDispatchSelection()

const columns = useOrderColumns({
  canAssign,
  canDelete,
  reload: () => reload(),
  select: selectOrder,
  confirmDelete: (id) => tableRef.value?.showDeleteModal(id),
})

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh, columnFilters} = useServerTable<OrderRow>({
  key: 'order-table',
  columns,
  // Only the plain list takes a saved filter; the other modes drop it.
  listOptions: (query) => listOptionsFor(mode.value, listQueryFrom(query), userFilterFrom(query)),
  urlSync: true,
  loadError: $trans('Error loading orders'),
})

const unaccepted = useUnacceptedCount()

function reload() {
  refresh()
  unaccepted.refetch()
}

const {filters: userFilters, active: activeUserFilter, toggle: toggleUserFilter} = useSavedFilterPills(columnFilters)
const isAllActive = computed(() => mode.value === 'all' && !activeUserFilter.value)

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

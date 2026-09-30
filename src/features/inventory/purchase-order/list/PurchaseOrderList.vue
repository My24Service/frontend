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
      :title="$trans('Purchase orders')"
      :search-label="$trans('Search purchase orders')"
      :label="$trans('Purchase order')"
      :empty-text="$trans('No purchase orders found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-purchaseorder-modal',
        confirmText: $trans('Are you sure you want to delete this purchase order?'),
        resource: Api.InventoryPurchaseorder,
        deletedDetail: $trans('Purchase order has been deleted'),
        deleteError: $trans('Error deleting purchase order'),
      }"
    >
      <template #icon><IBiFileEarmarkMedical /></template>
      <template #add>
        <router-link
          :to="{name: 'purchaseorder-add'}"
          class="btn btn-primary"
        >{{ $trans('Add purchase order') }}</router-link>
      </template>
    </ServerTable>
    <PurchaseOrderStatusModal ref="statusModal" />
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

import RowAction from '@/components/RowAction.vue'
import { ServerTable, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import PurchaseOrderProgressCell from './PurchaseOrderProgressCell.vue'
import PurchaseOrderStatusModal from './PurchaseOrderStatusModal.vue'

/**
 * The purchase orders, with a row action to add a status and the usual edit
 * and delete. The API offers search and paging but no ordering, so the columns
 * do not sort (the legacy screen sorted only the loaded page).
 */
type PurchaseOrderRow = ListRow<Api.PaginatedPurchaseOrderListList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')
const statusModal = useTemplateRef<{show: (purchaseOrderId: number) => void}>('statusModal')

const helper = createAppColumnHelper<PurchaseOrderRow>()

const columns = helper.columns([
  helper.accessor('purchase_order_id', {
    header: $trans('Order'),
    cell: ({row}) => h(RouterLink, {
      to: {name: 'purchaseorder-view', params: {pk: row.original.id}},
    }, () => `${row.original.purchase_order_id} ${row.original.order_name}`),
  }),
  helper.accessor('supplier_reservation', {
    header: $trans('Reservation'),
    cell: ({row}) => {
      const reservation = row.original.supplier_reservation
      if (!reservation) return h('span', {class: 'dimmed'}, '—')
      return h('span', [h(RouterLink, {
        to: {name: 'supplier-reservation-view', params: {pk: reservation}},
      }, () => String(reservation))])
    },
  }),
  helper.accessor('last_status', {
    header: $trans('Status'),
    cell: ({row}) => h('small', {title: row.original.last_status_full ?? undefined}, row.original.last_status),
  }),
  helper.accessor('expected_entry_date', {
    header: $trans('Expected entry date'),
    meta: {width: '15%'},
  }),
  helper.accessor('created', {
    header: $trans('Created'),
    meta: {width: '15%'},
  }),
  helper.display({
    id: 'totals',
    header: $trans('# entries / # products'),
    meta: {width: '15%'},
    cell: ({row}) => h(PurchaseOrderProgressCell, {
      entries: row.original.total_entries,
      materials: row.original.total_materials,
      delay: row.index,
    }),
  }),
  helper.display({
    id: 'icons',
    header: '',
    meta: {width: '15%'},
    cell: ({row}) => h('div', {class: 'h2 float-end'}, [
      h(RowAction, {
        icon: 'plus',
        title: $trans('Change status'),
        method: () => statusModal.value?.show(row.original.id),
      }),
      h(RowAction, {
        icon: 'edit',
        title: $trans('Edit'),
        router_name: 'purchaseorder-edit',
        router_params: {pk: row.original.id},
      }),
      h(RowAction, {
        icon: 'delete',
        title: $trans('Delete'),
        method: () => tableRef.value?.showDeleteModal(row.original.id),
      }),
    ]),
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<PurchaseOrderRow>({
  key: 'purchase-order-table',
  columns,
  enableSorting: false,
  resource: Api.InventoryPurchaseorder,
  urlSync: true,
  loadError: $trans('Error loading purchase orders'),
})
</script>

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
      :title="$trans('Reservations')"
      :search-label="$trans('Search reservations')"
      :label="$trans('Reservation')"
      :empty-text="$trans('No reservations found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-supplier-reservation-modal',
        confirmText: $trans('Are you sure you want to delete this reservation?'),
        resource: Api.InventorySupplierReservation,
        deletedDetail: $trans('Reservation has been deleted'),
        deleteError: $trans('Error deleting reservation'),
      }"
    >
      <template #icon><IBiFileEarmarkLock /></template>
      <template #add>
        <router-link
          :to="{name: 'supplier-reservation-add'}"
          class="btn btn-primary"
        >{{ $trans('Add reservation') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { ServerTable, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import ReservationMaterialsCell from './ReservationMaterialsCell.vue'

/**
 * The supplier reservations. The API offers search and paging but no
 * ordering, so the columns do not sort (the legacy screen sorted only the
 * loaded page).
 */
type ReservationRow = ListRow<Api.PaginatedSupplierReservationList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const helper = createAppColumnHelper<ReservationRow>()

const columns = helper.columns([
  helper.accessor('id', {
    header: $trans('Reservation'),
    cell: ({row}) => h(RouterLink, {
      to: {name: 'supplier-reservation-view', params: {pk: row.original.id}},
    }, () => `${row.original.id}. ${row.original.supplier_view.name}, ${row.original.supplier_view.city}`),
  }),
  helper.display({
    id: 'materials',
    header: $trans('Materials'),
    cell: ({row}) => h(ReservationMaterialsCell, {materials: row.original.materials}),
  }),
  helper.accessor('created', {
    header: $trans('Created'),
  }),
  createActionColumn(helper, {
    editRoute: 'supplier-reservation-edit',
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<ReservationRow>({
  key: 'supplier-reservation-table',
  columns,
  enableSorting: false,
  resource: Api.InventorySupplierReservation,
  urlSync: true,
  loadError: $trans('Error loading reservations'),
})
</script>

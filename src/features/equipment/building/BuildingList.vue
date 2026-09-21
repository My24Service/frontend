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
      :title="$trans('Buildings')"
      :search-label="$trans('Search buildings')"
      :label="$trans('building')"
      :empty-text="$trans('No buildings found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-building-modal',
        confirmText: $trans('Are you sure you want to delete this building?'),
        destroyMutation: equipmentBuildingDestroyMutation,
        invalidate: invalidateReads(equipmentBuilding),
        deletedDetail: $trans('building has been deleted'),
        deleteError: $trans('Error deleting building'),
      }"
    >
      <template #add>
        <router-link
          :to="{name: newLink}"
          class="btn"
        >{{ $trans('New building') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import {
  equipmentBuildingDestroyMutation,
  equipmentBuildingListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedBuildingList } from '@/api/types.gen'
import { equipmentBuilding } from '@/api/resources.gen'
import { invalidateReads } from '@/features/forms'
import { useAuthStore } from '@/features/auth'
import { ServerTable, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'

type BuildingRow = ListRow<PaginatedBuildingList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

// Read once, as the legacy screen read them in `created()`.
const hasBranches = useMainStore().getMemberHasBranches
const authStore = useAuthStore()
// "Planning" in the legacy screen's sense: neither a branch employee nor a
// customer. Those two roles see no owner column.
const planning = !authStore.isEmployee && !authStore.isCustomer

// One name stem, because there is one mount: only `router/equipment.js` renders
// this screen, and it does so for every member. The legacy screen branched to a
// `customers-building-*` family when the member had no branches, and no router
// ever defined those names - so those links were dead. A customer-facing
// buildings section would have to mount these screens before that prefix could
// mean anything.
const editLink = 'equipment-building-edit'
const viewLink = 'equipment-building-view'
const newLink = 'equipment-building-add'

const helper = createAppColumnHelper<BuildingRow>()

// Both owner cells pass the row's own id where the legacy screen did, which is
// not the related entity's id; preserved, see the README. The guard is not
// optional: the generated `customer_branch_view` is nullable, and the legacy
// template dereferenced it unguarded.
function ownerLabel(row: BuildingRow) {
  const owner = row.customer_branch_view
  if (!owner) return null
  return `${owner.name} - ${owner.city}`
}

const columns = helper.columns([
  ...(planning && !hasBranches ? [helper.display({
    id: 'customer',
    header: $trans('Customer'),
    cell: ({row}) => {
      const label = ownerLabel(row.original)
      if (!label) return ''
      return h(RouterLink, {to: {name: 'customer-view', params: {pk: row.original.id}}}, () => label)
    },
  })] : []),
  ...(planning && hasBranches ? [helper.display({
    id: 'branch',
    header: $trans('Branch'),
    cell: ({row}) => {
      const label = ownerLabel(row.original)
      if (!label) return ''
      return h(RouterLink, {to: {name: 'company-branch-view', params: {pk: row.original.id}}}, () => label)
    },
  })] : []),
  helper.accessor('name', {
    header: $trans('Name'),
    cell: ({row}) => h(RouterLink, {
      to: {name: viewLink, params: {pk: row.original.id}},
    }, () => row.original.name),
  }),
  helper.accessor('created', {header: $trans('Created')}),
  helper.accessor('modified', {header: $trans('Modified')}),
  createActionColumn(helper, {
    editRoute: editLink,
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<BuildingRow>({
  key: 'building-table',
  columns,
  // The endpoint declares no `ordering` parameter, so the kit's sort state is
  // never forwarded - it would be an undeclared parameter.
  enableSorting: false,
  listOptions: (query) => equipmentBuildingListOptions({
    query: {
      page: query.page,
      page_size: query.page_size,
      ...(query.q ? {q: query.q} : {}),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading buildings'),
})
</script>

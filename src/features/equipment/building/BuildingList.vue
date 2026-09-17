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
        invalidate: invalidateBuildingList,
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
import { h, useTemplateRef } from 'vue'
import { RouterLink } from 'vue-router'
import {
  equipmentBuildingDestroyMutation,
  equipmentBuildingListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedBuildingList } from '@/api/types.gen'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import { useAuthStore } from '@/features/auth/store'
import { ServerTable, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import { invalidateBuildingList } from '../invalidation'

type BuildingRow = ListRow<PaginatedBuildingList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

// Read once, as the legacy screen read them in `created()`.
const hasBranches = useMainStore().getMemberHasBranches
const authStore = useAuthStore()
// "Planning" in the legacy screen's sense: neither a branch employee nor a
// customer. Those two roles see no owner column.
const planning = !authStore.isEmployee && !authStore.isCustomer

// This list has one mount (the equipment router) and takes no `route_prefix`;
// the legacy screen hardcoded the two name stems instead. The `customers-building-*`
// arm is what the legacy screen asked for when the member has no branches, and
// no router defines those names - preserved as-is, see the module README's
// preserved-defects list.
const editLink = hasBranches ? 'equipment-building-edit' : 'customers-building-edit'
const viewLink = hasBranches ? 'equipment-building-view' : 'customers-building-view'
const newLink = hasBranches ? 'equipment-building-add' : 'customers-building-add'

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
  helper.display({
    id: 'icons',
    header: '',
    cell: ({row}) => h('div', {class: 'h2 float-right'}, [
      h(IconLinkEdit, {
        router_name: editLink,
        router_params: {pk: row.original.id},
        title: $trans('Edit'),
      }),
      h(IconLinkDelete, {
        title: $trans('Delete'),
        method: () => tableRef.value?.showDeleteModal(row.original.id),
      }),
    ]),
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

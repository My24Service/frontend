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
import { ServerTable, baseListParams, useServerTable, type ListRow } from '@/features/table'
import { useBuildingColumns } from './use-building-columns'
type BuildingRow = ListRow<PaginatedBuildingList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

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
const newLink = 'equipment-building-add'

const columns = useBuildingColumns({
  planning,
  onDelete: (id) => tableRef.value?.showDeleteModal(id),
})

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<BuildingRow>({
  key: 'building-table',
  columns,
  // The endpoint declares search, paging, `ordering` and the column filters
  // (apps/equipment/views.py), so the kit forwards all three.
  listOptions: (query) => equipmentBuildingListOptions({
    query: {
      ...baseListParams(query),

      ...(query.name ? {name: String(query.name)} : {}),
      ...(query.customer ? {customer: String(query.customer)} : {}),
      ...(query.branch ? {branch: String(query.branch)} : {}),
      ...(query.created ? {created: String(query.created)} : {}),
      ...(query.modified ? {modified: String(query.modified)} : {}),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading buildings'),
})
</script>

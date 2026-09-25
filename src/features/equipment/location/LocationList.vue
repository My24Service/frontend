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
      :title="$trans('Locations')"
      :search-label="$trans('Search locations')"
      :label="$trans('Location')"
      :empty-text="$trans('No locations found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-location-modal',
        confirmText: $trans('Are you sure you want to delete this location?'),
        destroyMutation: equipmentLocationDestroyMutation,
        invalidate: EquipmentLocation.invalidate,
        deletedDetail: $trans('Location has been deleted'),
        deleteError: $trans('Error deleting location'),
      }"
    >
      <template #icon><IBiShopWindow /></template>
      <template #toolbar-extra>
        <ActionButton icon="download"
          :method="downloadList"
          :title="$trans('Download QR-codes')"
        />
      </template>
      <template #add>
        <router-link
          :to="addRoute"
          class="btn btn-primary"
        >{{ $trans('Add location') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { equipmentLocationExportQrRetrieve } from '@/api/sdk.gen'
import { useFileDownload, XLSX_MIME } from '@/features/shared'
import {
  equipmentLocationDestroyMutation,
  equipmentLocationListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedLocationList } from '@/api/types.gen'
import { EquipmentLocation } from '@/api/resources.gen'
import { ServerTable, baseListParams, useServerTable, type ListRow } from '@/features/table'
import { useLocationColumns } from './use-location-columns'
const props = withDefaults(defineProps<{
  /** Mounted by the settings layout, which adds the row actions. */
  from_settings?: boolean
  /** The route name stem this mount answers to (`equipment-location`, `settings-location`, ...). */
  route_prefix: string
}>(), {
  from_settings: false,
})

type LocationRow = ListRow<PaginatedLocationList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const authStore = useAuthStore()
// "Planning" in the legacy screen's sense: neither a branch employee nor a
// customer. Those two roles see no owner column.
const planning = !authStore.isEmployee && !authStore.isCustomer

const addRoute = computed(() => toRoute(`${props.route_prefix}-add` as RouteName))

const columns = useLocationColumns({
  routePrefix: props.route_prefix,
  fromSettings: props.from_settings,
  planning,
  onDelete: (id) => tableRef.value?.showDeleteModal(id),
})

const {table, searchDraft, globalFilter, pagination, count, isLoading, isFetching, refresh} = useServerTable<LocationRow>({
  key: 'location-table',
  columns,
  // The endpoint declares search, paging, `ordering` and the column filters
  // (apps/equipment/views.py), so the kit forwards all three: the sort state
  // and the filters both travel in the query and in the address bar.
  listOptions: (query) => equipmentLocationListOptions({
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
  loadError: $trans('Error loading locations'),
})

const download = useFileDownload()

function downloadList() {
  globalFilter.value = searchDraft.value

  const q = globalFilter.value
  download.fromApi(
    () => equipmentLocationExportQrRetrieve({query: q ? {q} : {}, throwOnError: true}),
    'locations.xlsx', XLSX_MIME)
}
</script>

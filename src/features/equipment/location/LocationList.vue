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
        invalidate: invalidateReads(equipmentLocation),
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
import { equipmentLocation } from '@/api/resources.gen'
import { invalidateReads } from '@/features/forms'
import { ServerTable, createActionColumn, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
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

// Read once, as the legacy screen read them in `created()`.
const hasBranches = useMainStore().getMemberHasBranches
const authStore = useAuthStore()
// "Planning" in the legacy screen's sense: neither a branch employee nor a
// customer. Those two roles see no owner column.
const planning = !authStore.isEmployee && !authStore.isCustomer

const addRoute = computed(() => toRoute(`${props.route_prefix}-add` as RouteName))

const helper = createAppColumnHelper<LocationRow>()

// "Name · City" as one dimmed suffix, the shape both owner cells share.
function ownerLabel(row: LocationRow) {
  const owner = row.customer_branch_view
  if (!owner) return null
  return [owner.name, h('span', {class: 'dimmed'}, ` · ${owner.city}`)]
}

const columns = helper.columns([
  helper.accessor('name', {
    header: $trans('Name'),
    cell: ({row}) => h(RouterLink, {
      to: toRoute(`${props.route_prefix}-view` as RouteName, {pk: row.original.id}),
    }, () => row.original.name),
  }),
  // The endpoint declares no `ordering` parameter (the legacy screen's sort
  // headers were sent as `sort_field`/`sort_dir` and dropped by the backend),
  // so this list turns sorting off wholesale rather than rendering headers that
  // cannot be honoured. See the module README.
  ...(planning && !hasBranches ? [helper.display({
    id: 'customer',
    header: $trans('Customer'),
    cell: ({row}) => ownerLabel(row.original) ?? '-',
  })] : []),
  ...(planning && hasBranches ? [helper.display({
    id: 'branch',
    header: $trans('Branch'),
    cell: ({row}) => {
      const label = ownerLabel(row.original)
      if (!label) return '-'
      // The legacy cell passed the row's own id to a route that resolves a
      // branch. Preserved as-is: see the module README's preserved-defects list.
      return h(RouterLink, {to: toRoute('company-branch-view', {pk: row.original.id})}, () => label)
    },
  })] : []),
  helper.accessor('created', {
    header: $trans('Created'),
    cell: ({row}) => h('small', row.original.created),
  }),
  helper.accessor('modified', {
    header: $trans('Modified'),
    cell: ({row}) => h('small', row.original.modified),
  }),
  ...(props.from_settings ? [createActionColumn(helper, {
    editRoute: `${props.route_prefix}-edit` as RouteName,
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
  })] : []),
])

const {table, searchDraft, globalFilter, pagination, count, isLoading, isFetching, refresh} = useServerTable<LocationRow>({
  key: 'location-table',
  columns,
  // The endpoint offers search and paging but no ordering, so the kit's sort
  // state is never forwarded - sending it would be an undeclared parameter,
  // which URL sync could otherwise restore from a shared address.
  enableSorting: false,
  listOptions: (query) => equipmentLocationListOptions({
    query: {
      page: query.page,
      page_size: query.page_size,
      ...(query.q ? {q: query.q} : {}),
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

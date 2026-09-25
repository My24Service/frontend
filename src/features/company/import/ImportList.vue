<template>
  <div class="app-page">
    <b-modal
      id="revert-import-modal"
      ref="revertModal"
      :title="$trans('Revert?')"
      @ok.prevent="revertImport"
    >
      <p class="my-4">{{ $trans('Revert this import? All created and related data will be deleted.') }}</p>
    </b-modal>

    <ServerTable
      ref="tableRef"
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :title="$trans('Imports')"
      :search-label="$trans('Search imports')"
      :label="$trans('Import')"
      :empty-text="$trans('No imports found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-company-import-modal',
        confirmText: $trans('Are you sure you want to delete this import?'),
        destroyMutation: Api.CompanyImport.destroy.mutation,
        invalidate: Api.CompanyImport.invalidate,
        deletedDetail: $trans('Import has been deleted'),
        deleteError: $trans('Error deleting import'),
      }"
    >
      <template #icon><IBiFileArrowDown /></template>
      <template #add>
        <router-link
          :to="toRoute(`${route_prefix}-add` as RouteName)"
          class="btn btn-primary"
        ><IBiFileArrowDown />{{ $trans('Add import') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { hLink } from '@/components/render'
import { Fragment } from 'vue'
import { RouterLink } from 'vue-router'
import IBiArrowCounterclockwise from '~icons/bi/arrow-counterclockwise'

import RowAction from '@/components/RowAction.vue'
import { fileNameOf } from '@/features/shared'
import { ServerTable, baseListParams, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
/**
 * The import list, mounted by the company router and the settings layout.
 * The mount answers one route stem (`company-import`, `settings-company-import`),
 * which the routers supply - from_settings plays no role on these screens.
 *
 * A row is either pending (no counts yet: preview link when the backend has
 * nothing, edit and delete) or executed (counts: revert). The conditions are
 * the legacy screen's, including its quirk: an empty result reads as pending.
 */
type ImportRow = ListRow<Api.PaginatedImportList>

const props = defineProps<{
  /** The route name stem this mount answers to. Supplied by the routers. */
  route_prefix: string
}>()

const queryClient = useQueryClient()
const { create: toast } = useToast()

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')
const revertModal = useTemplateRef<{show: () => void, hide: () => void}>('revertModal')
const revertPk = ref<number | null>(null)

const helper = createAppColumnHelper<ImportRow>()

/** Executed means counts exist; an empty or absent result reads as pending. */
function isExecuted(resultInserts: Record<string, number> | null | undefined): boolean {
  return Object.keys(resultInserts ?? {}).length > 0
}

const columns = helper.columns([
  helper.accessor('name', {
    header: $trans('Name'),
    cell: ({ row }) => (isExecuted(row.original.result_inserts)
      ? (row.original.name ?? '')
      : h(RouterLink, {
        to: toRoute(`${props.route_prefix}-preview` as RouteName, { pk: row.original.id }),
      }, () => row.original.name ?? '')),
  }),
  helper.display({
    id: 'file',
    header: $trans('File'),
    enableSorting: false,
    cell: ({ row }) => fileNameOf(row.original.file),
  }),
  helper.display({
    id: 'result',
    header: $trans('Result'),
    enableSorting: false,
    cell: ({ row }) => h(Fragment, null, Object.entries(row.original.result_inserts ?? {}).map(([modelType, inserts]) =>
      h('span', null, [`${modelType}: `, h('b', `${inserts} ${$trans('inserted')}`), h('br')]))),
  }),
  helper.accessor('created', {
    header: $trans('Created'),
  }),
  helper.accessor('modified', {
    header: $trans('Modified'),
  }),
  helper.display({
    id: 'icons',
    header: '',
    enableSorting: false,
    cell: ({ row }) => {
      if (isExecuted(row.original.result_inserts)) {
        return h('div', { class: 'h2 float-right' }, [
          hLink({
            title: $trans('Revert import'),
            onClick: () => showRevertModal(row.original.id),
          }, () => h(IBiArrowCounterclockwise)),
        ])
      }
      return h('div', { class: 'h2 float-right' }, [
        h(RowAction, {icon: 'edit',
          router_name: `${props.route_prefix}-edit` as RouteName,
          router_params: { pk: row.original.id },
          title: $trans('Edit'),
        }),
        h(RowAction, {icon: 'delete',
          title: $trans('Delete'),
          method: () => tableRef.value?.showDeleteModal(row.original.id),
        }),
      ])
    },
  }),
])

const { table, searchDraft, pagination, count, isLoading, isFetching, refresh } = useServerTable<ImportRow>({
  key: 'import-table',
  columns,
  // The legacy table offered no sorting, and the endpoint declares no
  // `ordering` - the headers stay non-sortable rather than rendering controls
  // nothing honours.
  enableSorting: false,
  listOptions: (query) => Api.CompanyImport.list.options({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading imports'),
})

const revertMutation = useMutation(Api.CompanyImport.extras.revertCreate.mutation())

function showRevertModal(id: number) {
  revertPk.value = id
  revertModal.value?.show()
}

/**
 * The revert confirmation, as a modal rather than the legacy blocking
 * `confirm()`: same copy, same toast pair, and the list refetches behind it.
 */
async function revertImport() {
  if (revertPk.value == null) return
  try {
    await revertMutation.mutateAsync({ path: { id: revertPk.value } })
    infoToast(toast, $trans('Reverted'), $trans('Import has been reverted'))
    await Api.CompanyImport.invalidate(queryClient)
    revertModal.value?.hide()
  } catch {
    errorToast(toast, $trans('Error reverting import'))
  }
}
</script>

<style scoped>
/* Scoped back down from the legacy screen, whose block missed the attribute
 * and aligned every table in the app. See the module README. */
table td {
  vertical-align: top !important;
}
table td a {
  display: table-cell !important;
}
</style>

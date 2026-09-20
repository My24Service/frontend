<template>
  <ListDeleteModal
    v-if="deleteModal"
    ref="deleteModalRef"
    :modal-id="deleteModal.modalId"
    :confirm-text="deleteModal.confirmText"
    :destroy-mutation="deleteModal.destroyMutation"
    :invalidate="deleteModal.invalidate"
    :deleted-detail="deleteModal.deletedDetail"
    :delete-error="deleteModal.deleteError"
  />

  <ListPageHeader
    v-model:search-draft="searchDraft"
    :title="title"
    :search-label="searchLabel"
    :refresh="refresh"
  >
    <template #icon>
      <slot name="icon" />
    </template>
    <template #toolbar-extra>
      <slot name="toolbar-extra" />
    </template>
    <template #add>
      <slot name="add" />
    </template>
  </ListPageHeader>

  <!-- Between the title bar and the table: the tabs or pills a screen uses to
       switch between kinds of the same list (the statuscode types). -->
  <div v-if="$slots.subnav" class="subnav-pills">
    <slot name="subnav" />
  </div>

  <component
    :is="pageDetails ? 'div' : NoPanelWrapper"
    :class="pageDetails ? 'page-details panel' : undefined"
  >
    <!-- The column filters, in the panel above the table (not inside the
         table's overflow-auto box, which would clip the editors' popovers).
         Renders nothing when no column declares one (table.ts, ColumnMeta.filter). -->
    <ColumnFilterBar :table="table" />

    <div class="app-detail panel overflow-auto">
      <div class="data-table">
        <ServerDataTable
          :table="table"
          :is-loading="isLoading"
          :empty-text="emptyText"
          :row-class="rowClass"
        />
      </div>
    </div>

    <ServerTablePagination
      v-if="!isLoading"
      :table="table"
      :pagination="pagination"
      :count="count"
      :label="label"
      :is-fetching="isFetching"
    />
  </component>
</template>

<script setup lang="ts" generic="TData extends RowData">
import type { PaginationState, RowData, VueTable } from '@tanstack/vue-table'
import type { QueryClient } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import ColumnFilterBar from './filters/ColumnFilterBar.vue'
import ListDeleteModal from './ListDeleteModal.vue'
import ListPageHeader from './ListPageHeader.vue'
import ServerDataTable from './ServerDataTable.vue'
import ServerTablePagination from './ServerTablePagination.vue'
import type { AppFeatures } from './table'

withDefaults(defineProps<{
  /** The instance `useServerTable` returned. */
  table: VueTable<AppFeatures, TData>
  /** The page the engine is on — the table state itself is the engine's. */
  pagination: PaginationState
  /** Total rows the backend reported for this query. */
  count?: number
  isLoading?: boolean
  isFetching?: boolean
  emptyText?: string
  /** The noun after the row count, e.g. "Module" in "45 Module". */
  label?: string
  /** Per-row class from the row's data — the customer list's branch highlight. */
  rowClass?: (row: TData) => string
  pageDetails?: boolean
  title: string
  searchLabel: string
  /** The header's refresh button — `useServerTable`'s `refresh`. */
  refresh: () => void
  /**
   * The delete confirmation, absent on read-only lists that offer no row
   * actions. Without it no modal renders and `showDeleteModal` is a no-op.
   */
  deleteModal?: {
    /** The `b-modal` id — kept per screen for the legacy DOM id (`delete-xxx-modal`). */
    modalId: string
    /** e.g. "Are you sure you want to delete this customer?" */
    confirmText: string
    // `any` for the mutation's data/error/variables — see use-list-delete.ts's
    // matching note; a generated destroy-mutation factory's shape is
    // per-resource and restating it here would reject exactly the factories
    // this exists to accept.
    destroyMutation: () => UseMutationOptions<any, AxiosError<any>, any>
    invalidate: (queryClient: QueryClient) => Promise<unknown> | void
    deletedDetail: string
    deleteError: string
  }
}>(), {
  count: 0,
  isLoading: false,
  isFetching: false,
  pageDetails: true,
  label: '',
})

const NoPanelWrapper = defineComponent({
  name: 'NoPanelWrapper',
  setup(_props, {slots}) {
    return () => slots.default?.()
  },
})

const deleteModalRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('deleteModalRef')

function showDeleteModal(id: number) {
  deleteModalRef.value?.showDeleteModal(id)
}

defineExpose({showDeleteModal})

const searchDraft = defineModel<string>('searchDraft', {required: true})
</script>

<style scoped>
.subnav-pills {
  margin: 0 0 20px;
}
</style>

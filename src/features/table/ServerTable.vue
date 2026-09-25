<template>
  <ListDeleteModal
    v-if="deleteModal"
    ref="deleteModalRef"
    :modal-id="deleteModal.modalId"
    :confirm-text="deleteModal.confirmText"
    :resource="deleteModal.resource"
    :invalidate="deleteModal.invalidate"
    :deleted-detail="deleteModal.deletedDetail"
    :delete-error="deleteModal.deleteError"
  />

  <ListPageHeader
    v-model:search-draft="searchDraft"
    :table="table"
    :title="title"
    :search-label="searchLabel"
    :refresh="refresh"
    :searchable="searchable"
  >
    <template #icon>
      <slot name="icon" />
    </template>
    <template #toolbar-extra>
      <slot name="toolbar-extra" />
    </template>
    <template #header-actions>
      <slot name="header-actions" />
    </template>
    <template #add>
      <slot name="add" />
    </template>
  </ListPageHeader>

  <!-- Between the title bar and the table: the filters in force, then the tabs
       or pills a screen uses to switch between kinds of the same list (the
       statuscode types). Above the panel, not inside its overflow-auto box
       below, which would clip the chips' editor popovers. -->
  <div v-if="$slots.subnav || chips.length > 0" class="subnav-pills">
    <ColumnFilterChips :table="table" />
    <slot name="subnav" />
  </div>

  <component
    :is="pageDetails ? 'div' : NoPanelWrapper"
    :class="pageDetails ? 'page-details panel' : undefined"
  >
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
      :page-size-options="pageSizeOptions"
    />
  </component>
</template>

<script setup lang="ts" generic="TData extends RowData">
import type { PaginationState, RowData, VueTable } from '@tanstack/vue-table'
import type { QueryClient } from '@tanstack/vue-query'
import { ColumnFilterChips } from '@/features/table/filters'
import { useColumnFilters } from '@/features/table/filters/use-column-filters'
import ListDeleteModal from './ListDeleteModal.vue'
import type { DeletableResource } from './use-list-delete'
import ListPageHeader from './ListPageHeader.vue'
import ServerDataTable from './ServerDataTable.vue'
import ServerTablePagination from './ServerTablePagination.vue'
import type { AppFeatures } from './table'

const props = withDefaults(defineProps<{
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
  /** False on a list whose endpoint declares no `q`; the field is then no field. */
  searchable?: boolean
  /** Rows per page the pager offers. Defaults to 10/20/50, the API's own sizes. */
  pageSizeOptions?: number[]
  /**
   * The delete confirmation, absent on read-only lists that offer no row
   * actions. Without it no modal renders and `showDeleteModal` is a no-op.
   */
  deleteModal?: {
    /** The `b-modal` id — kept per screen for the legacy DOM id (`delete-xxx-modal`). */
    modalId: string
    /** e.g. "Are you sure you want to delete this customer?" */
    confirmText: string
    /** The resource whose row is deleted: `Api.CompanyBranch`. */
    resource: DeletableResource
    /** Only when a delete stales other reads than the resource's own; see `useListDelete`. */
    invalidate?: (queryClient: QueryClient) => Promise<unknown> | void
    deletedDetail: string
    deleteError: string
  }
}>(), {
  count: 0,
  isLoading: false,
  isFetching: false,
  pageDetails: false,
  label: '',
  searchable: true,
  pageSizeOptions: () => [10, 20, 50],
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

/**
 * The same filter state the header's menu and the chips read. The subnav area
 * is here, so the question "is there anything to show between the title bar
 * and the table" is answered here: the page's own subnav got the area, or a
 * filter in force did.
 */
const { chips } = useColumnFilters(props.table)
</script>

<style scoped>
.subnav-pills {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0 1.5rem 20px;

  &:empty {
    display: none;
  }
}
</style>

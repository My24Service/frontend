export { default as ServerTable } from './ServerTable.vue'
export {
  createAppColumnHelper,
  type AppFeatures,
  type ColumnFilterSpec,
  type FilterOption,
} from './table'
export {
  useServerTable,
  type ListQueryOptions,
  type PageableResource,
  type ServerTableOptions,
} from './use-server-table'
export {
  baseListParams,
  WHOLE_COLLECTION_PAGE_SIZE,
  type ServerPagedListQuery,
} from './server-paged-list'
export {
  createActionColumn,
  type ListRow,
} from './list-columns'
export { useConfirmedAction } from './use-confirmed-action'

// `ColumnMeta` is the kit's own augmentation of the framework type (declared in
// `./table`), so it is re-exported from the framework: the augmentation is what
// gives it `filter`/`width`.
export type { ColumnMeta } from '@tanstack/vue-table'
export {
  describeDateFilter,
  describeNumberFilter,
  formatDateFilter,
  formatNumberFilter,
  joinArrayItems,
  parseDateFilter,
  parseNumberFilter,
  periodEnd,
  periodFromDate,
  periodStart,
  splitArrayItems,
} from './filters'
export { default as ServerDataTable } from './ServerDataTable.vue'
export { default as ListDeleteModal } from './ListDeleteModal.vue'
export type { DeletableResource } from './use-list-delete'
export { default as ListPageHeader } from './ListPageHeader.vue'

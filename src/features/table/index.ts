export { default as ServerTable } from './ServerTable.vue'
export { createAppColumnHelper } from './table'
export { useServerTable } from './use-server-table'
export { baseListParams } from './server-paged-list'
export { createActionColumn } from './list-columns'
export { useConfirmedAction } from './use-confirmed-action'

export type { ListRow } from './list-columns'
export type { AppFeatures } from './table'
// `ColumnMeta` is the kit's own augmentation of the framework type (declared in
// `./table`), so it is re-exported from the framework: the augmentation is what
// gives it `filterVariant`/`filterPlaceholder`/`width`.
export type { ColumnMeta } from '@tanstack/vue-table'
export type { ServerTableOptions } from './use-server-table'
export type { ServerPagedListQuery } from './server-paged-list'

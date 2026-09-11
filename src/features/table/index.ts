/**
 * The table kit's public surface.
 *
 * The kit is the shared server-paged TanStack Table machinery every list
 * screen renders through: one engine (`useServerTable`), one screen-facing
 * component (`ServerTable`), the column helpers (`createAppColumnHelper`,
 * `createActionColumn`, `ListRow`), the wire params a screen spreads into its
 * list options (`baseListParams`) and the confirmation flow for a second row
 * action (`useConfirmedAction`).
 *
 * This is the kit's door: a screen names one concept here instead of five
 * module paths. The kit's modules keep their own exports - this file is
 * additive - and nothing inside the kit imports it; the kit's internal wiring
 * is reached module-to-module, as before.
 *
 * The internals are deliberately not exported here: the `hook`, the URL mirror
 * (`useUrlQuerySync`), the delete plumbing (`useListDelete`), the wire envelope
 * (`PagedEnvelope`) and the `ListPageHeader`/`ListDeleteModal` components have
 * no consumer outside the kit, so they stay private rather than becoming part
 * of what a screen may reach for.
 */
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

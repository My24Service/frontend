import {
  columnFilteringFeature,
  createTableHook,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from '@tanstack/vue-table'
import type { CellData, RowData, TableFeatures } from '@tanstack/vue-table'

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filterFns: {
    includesString: filterFn_includesString,
    equalsString: filterFn_equalsString,
  },
})

/**
 * The kit's table hook: exported for the engine in `use-server-table.ts`.
 * A screen goes through `useServerTable` and never reaches for this.
 */
export const hook = createTableHook({
  features,
  manualFiltering: true,
  manualPagination: true,
  manualSorting: true,
})

export const createAppColumnHelper = hook.createAppColumnHelper

/** The app's feature set, for typing components that take a table instance. */
export type AppFeatures = typeof features

/**
 * What the shared header components read off a column definition. Set
 * `filterVariant` on a column to have the table's filter row render an
 * input for it — accessor columns only: a display column cannot filter,
 * whatever its meta says (`getCanFilter` requires an accessorFn, and the
 * filter row honours that rather than the meta). Set `width` (e.g. '20%')
 * to pin the column's width through the table's colgroup.
 */
declare module '@tanstack/vue-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<in out TFeatures extends TableFeatures, in out TData extends RowData, TValue extends CellData = CellData> {
    filterVariant?: 'text'
    /** Hint for a filter input whose value grammar is not obvious. */
    filterPlaceholder?: string
    width?: string
  }
}

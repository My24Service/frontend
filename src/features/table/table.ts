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

export const hook = createTableHook({
  features,
  manualFiltering: true,
  manualPagination: true,
  manualSorting: true,
})

export const createAppColumnHelper = hook.createAppColumnHelper

/** The app's feature set, for typing components that take a table instance. */
export type AppFeatures = typeof features

declare module '@tanstack/vue-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<in out TFeatures extends TableFeatures, in out TData extends RowData, TValue extends CellData = CellData> {
    filterVariant?: 'text'
    /** Hint for a filter input whose value grammar is not obvious. */
    filterPlaceholder?: string
    width?: string
  }
}

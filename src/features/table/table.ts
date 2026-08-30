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

/**
 * The app's shared TanStack Table kit (v9), built on the framework's
 * `createTableHook` pattern: the feature set and its defaults are declared
 * once here, and every table screen creates its columns through the
 * feature-bound `createAppColumnHelper` and its instance through
 * `useAppTable` — neither has to thread `typeof features` around.
 *
 * Every list screen in this app is server-paged (the backend owns sorting,
 * filtering and pagination — see `server-paged-list.ts`), so the `manual*`
 * flags are defaults of the hook rather than per-screen noise. Registering
 * the client-side row models is deliberately left out: with `manual*` they
 * would never run.
 *
 * The built-in filter functions are opt-in in v9: the table resolves a
 * column's `filterFn` by name the moment a filter value is set, and an
 * unregistered name rejects the state change outright — with manual
 * filtering it would still never run, but it must resolve. Register only
 * the two the tables use (tree-shakeable individual imports, not the
 * deprecated `filterFns` mega-registry).
 */
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

const hook = createTableHook({
  features,
  manualFiltering: true,
  manualPagination: true,
  manualSorting: true,
})

export const useAppTable = hook.useAppTable
export const createAppColumnHelper = hook.createAppColumnHelper

/** The app's feature set, for typing components that take a table instance. */
export type AppFeatures = typeof features

/**
 * What the shared header components read off a column definition. Set
 * `filterVariant` on a column to have the table's filter row render an
 * input for it — accessor columns only: a display column cannot filter,
 * whatever its meta says (`getCanFilter` requires an accessorFn, and the
 * filter row honours that rather than the meta). `selectOptions` turns it
 * into a select. Set `width` (e.g. '20%') to pin the column's width through
 * the table's colgroup.
 */
declare module '@tanstack/vue-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<in out TFeatures extends TableFeatures, in out TData extends RowData, TValue extends CellData = CellData> {
    filterVariant?: 'text' | 'select'
    selectOptions?: Array<{value: string; label: string}>
    /** Hint for a filter input whose value grammar is not obvious. */
    filterPlaceholder?: string
    width?: string
  }
}

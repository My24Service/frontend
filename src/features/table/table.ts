import {
  columnFilteringFeature,
  createTableHook,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  type CellData,
  type RowData,
  type TableFeatures,
} from '@tanstack/vue-table'

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

/** One choice of a `select` filter. The value is what rides the wire. */
export interface FilterOption {
  value: string
  label: string
}

/**
 * How a column is filtered, as the filter bar offers it. The variant picks
 * the editor; the wire value it produces follows `apps/core/filters.py`'s
 * grammar (see ./filters/filter-grammar.ts).
 */
export type ColumnFilterSpec =
  | {
    variant: 'text'
    /** The chip and menu label; defaults to the column header when that is a string. */
    label?: string
    placeholder?: string
  }
  | {
    /** An exact number or a `low...high` range. */
    variant: 'number'
    label?: string
  }
  | {
    /** A day, month or year, or a range of those. */
    variant: 'date'
    label?: string
    /**
     * The calendar's year range, `[first, last]`. Left out, the picker offers
     * its own default (1900–2100), which for a date column with a known life —
     * an order's start date, say — is mostly years nothing can be in.
     */
    years?: [number, number]
  }
  | {
    /**
     * Any of several choices: the picks ride the wire comma-joined, which
     * is what the backend's `ArrayFilter` reads (a comma inside a value is
     * escaped `\,` on both sides).
     */
    variant: 'select'
    label?: string
    /**
     * The query parameter, when it is not the column id: a column that
     * shows a name but is really a foreign key filters on the key
     * (`order_name` shows, `customer_relation` filters).
     */
    param?: string
    /** The choices, when they are few enough to list at once. */
    options?: FilterOption[]
    /**
     * The choices for a search term, when there are too many to list: an
     * autocomplete endpoint, asked once with `''` for the first page of the
     * list and again as the term is typed. Takes precedence over `options`
     * for the list; `options` may still supply the labels of restored values.
     */
    loadOptions?: (term: string) => Promise<FilterOption[]>
    /**
     * The labels of values the list does not know — the ids a shared URL
     * restores — so their chip reads a name rather than a number. Asked
     * once per unknown value; without it the chip shows the value itself.
     */
    resolveLabels?: (values: string[]) => Promise<FilterOption[]>
    placeholder?: string
  }

declare module '@tanstack/vue-table' {
  // eslint-disable-next-line unused-imports/no-unused-vars
  interface ColumnMeta<in out TFeatures extends TableFeatures, in out TData extends RowData, TValue extends CellData = CellData> {
    /** Present on a column the filter bar offers; absent columns cannot be filtered from the screen. */
    filter?: ColumnFilterSpec
    width?: string
  }
}

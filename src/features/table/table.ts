import { computed, ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
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
import type {
  CellData,
  ColumnFiltersState,
  PaginationState,
  RowData,
  SortingState,
  TableFeatures,
  Updater,
} from '@tanstack/vue-table'
import type { AxiosError } from 'axios'
import { useToast } from 'bootstrap-vue-next'
import { errorToast } from '@/services/i18n'
import { useUrlQuerySync } from './url-query-sync'

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

/** The wire query every server-paged list sends, before resource extras. */
export interface ServerPagedListQuery {
  page: number
  page_size: number
  q?: string
  ordering?: string[]
  [column: string]: unknown
}

/**
 * The params every server-paged list sends, before its own extras: the page
 * pair, the toolbar search as `q`, and the engine's `ordering` list straight
 * onto the wire (the backend's OrderingMixin allow-list decides what sorts).
 * Screens spread this and add only their own filters, so the base mapping
 * lives in exactly one place.
 */
export function baseListParams(query: ServerPagedListQuery): Record<string, unknown> {
  return {
    page: query.page,
    page_size: query.page_size,
    ...(query.q ? {q: query.q} : {}),
    ...(query.ordering?.length ? {ordering: query.ordering} : {}),
  }
}

/**
 * What a list screen hands `useServerTable`: everything the table needs that
 * the screen alone knows — its columns, its resource's list options, and the
 * two list-level switches — plus any other table option, which passes
 * straight through to the engine. `data`, `rowCount` and the state
 * callbacks are the engine's own: it derives them from the query.
 */
export type ServerTableOptions<TData extends RowData> = Omit<
  Parameters<typeof hook.useAppTable<TData>>[0],
  'data' | 'rowCount' | 'state' | 'onSortingChange' | 'onColumnFiltersChange' | 'onPaginationChange'
> & {
  /**
   * The screen's generated `xxxListOptions` factory, handed the wire query.
   * The screen folds its own extras (variant filters) in here and returns
   * the options object the query runs on.
   */
  listOptions: (query: ServerPagedListQuery) => unknown

  /**
   * Mirror the wire query into the browser's URL bar and restore it from
   * there on load — shareable list views. See `url-query-sync.ts`.
   */
  urlSync?: boolean

  /** Translated at the call site: the toast when the list fails to load. */
  loadError?: string
}

function resolveUpdater<T>(updater: Updater<T>, previous: T): T {
  return typeof updater === 'function'
    ? (updater as (old: T) => T)(previous)
    : updater
}

/**
 * A server-paged list: the query, the table state that drives it, and the
 * table instance the screen renders through `ServerTable`.
 *
 * One composable for the whole engine. The screen supplies its columns and its
 * resource's list options; everything between — the debounced toolbar search,
 * the sort and filter state, the page, the wire query they compose, the
 * fetch's loading/fetching/error state and the URL mirror — is built here and
 * never handed back as loose pieces for a screen to reassemble.
 */
export function useServerTable<TData extends RowData>(config: ServerTableOptions<TData>) {
  const debounceMs = 300

  const {listOptions, urlSync, loadError, getRowId, ...tableOptions} = config

  const sorting = ref<SortingState>([])
  const columnFilters = ref<ColumnFiltersState>([])
  // 20 is the backend's My24Pagination default.
  const pagination = ref<PaginationState>({pageIndex: 0, pageSize: 20})
  const globalFilter = ref('')

  const searchDraft = ref('')

  watchDebounced(
    () => searchDraft.value,
    (value) => {
      // A URL restore writes the draft and the committed value together (see
      // useUrlQuerySync apply()): when they already agree there is nothing to
      // commit, and the page must stay where the URL put it.
      if (value === globalFilter.value) return
      globalFilter.value = value
      pagination.value = {...pagination.value, pageIndex: 0}
    },
    {debounce: debounceMs},
  )

  const committedFilters = ref<ColumnFiltersState>([])

  watchDebounced(
    () => columnFilters.value,
    (value) => {
      // Same as above: a restore that already committed these filters must
      // not snap the page back to 1 when the debounce fires.
      if (JSON.stringify(value) === JSON.stringify(committedFilters.value)) return
      committedFilters.value = value
      pagination.value = {...pagination.value, pageIndex: 0}
    },
    {debounce: debounceMs},
  )

  const wireQuery = computed<ServerPagedListQuery>(() => {
    const query: ServerPagedListQuery = {
      page: pagination.value.pageIndex + 1,
      page_size: pagination.value.pageSize,
    }

    if (globalFilter.value) query.q = globalFilter.value

    const ordering = sorting.value.map((sort) => (sort.desc ? '-' : '') + sort.id)
    if (ordering.length) query.ordering = ordering

    for (const filter of committedFilters.value) {
      const value = filter.value == null ? '' : String(filter.value)
      if (!value) continue
      query[filter.id] = value
    }

    return query
  })

  if (urlSync) {
    useUrlQuerySync(
      {
        searchDraft,
        globalFilter,
        sorting,
        columnFilters,
        committedFilters,
        pagination,
      },
      wireQuery,
      {defaultPageSize: 20},
    )
  }

  // The one seam where this composable touches the generated option types:
  // each resource's factory returns a shape only it knows, and restating it
  // here would reject exactly the objects this exists to accept. The cast is
  // intentional: the factory return is genuinely unknown at this boundary.
  //
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listQuery = useQuery(() => ({...(listOptions(wireQuery.value) as any), placeholderData: keepPreviousData}))

  const isLoading = computed(() => listQuery.isLoading.value)
  const isFetching = computed(() => listQuery.isFetching.value)
  const error = computed(() => listQuery.error.value as AxiosError | null)
  const rows = computed(() => ((listQuery.data.value as PagedEnvelope | undefined)?.results ?? []) as TData[])
  const count = computed(() => (listQuery.data.value as PagedEnvelope | undefined)?.count ?? 0)

  const {create} = useToast()

  watch(error, (value) => {
    if (value && loadError) errorToast(create, loadError)
  })

  function refresh() {
    listQuery.refetch()
  }

  watch(count, (c) => {
    const pageCount = Math.max(Math.ceil(c / pagination.value.pageSize), 1)
    if (pagination.value.pageIndex >= pageCount) pagination.value = {...pagination.value, pageIndex: pageCount - 1}
  })

  const table = hook.useAppTable<TData>({
    ...tableOptions,
    data: rows,
    rowCount: count,
    getRowId: getRowId ?? ((row: TData) => String((row as {id: number|string}).id)),
    state: {
      get sorting() {
        return sorting.value
      },
      get columnFilters() {
        return columnFilters.value
      },
      get globalFilter() {
        return globalFilter.value
      },
      get pagination() {
        return pagination.value
      },
    },
    onSortingChange: (updater: Updater<SortingState>) => {
      sorting.value = resolveUpdater(updater, sorting.value)
      pagination.value = {...pagination.value, pageIndex: 0}
    },
    onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) => {
      columnFilters.value = resolveUpdater(updater, columnFilters.value)
    },
    onPaginationChange: (updater: Updater<PaginationState>) => {
      pagination.value = resolveUpdater(updater, pagination.value)
    },
  })

  return {
    table,
    searchDraft,
    pagination,
    globalFilter,
    isLoading,
    isFetching,
    count,
    refresh,
    error,
  }
}

interface PagedEnvelope {
  count?: number
  results?: unknown[]
}

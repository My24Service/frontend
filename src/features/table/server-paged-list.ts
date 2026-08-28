import { computed, ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import type {
  ColumnFiltersState,
  PaginationState,
  RowData,
  SortingState,
  Updater,
} from '@tanstack/vue-table'
import type { AxiosError } from 'axios'
import { useToast } from 'bootstrap-vue-next'
import { errorToast } from '@/utils'

/**
 * The state + query engine behind every server-paged TanStack Table screen.
 *
 * The table instance is created by the screen (`useAppTable` with its own
 * columns); this composable owns the state that instance is controlled by —
 * sorting, column filters, pagination, the global search term — and the one
 * `useQuery` whose key folds all of it in. Everything is server-side: the
 * wire query carries `page`/`page_size`, the search term, the `ordering`
 * list and one param per active column filter, and the screen folds its
 * resource-specific extras (the Member variants) into the same object
 * through `listOptions`.
 *
 * The screen maps a column filter onto its own `<field>__<lookup>` query
 * params (django-filter naming — see MemberFilterSet) via
 * `columnFilterParam`; the composable cannot know those names, which is the
 * line between this shared engine and each resource's schema.
 *
 * Search terms and column filters commit to the wire on a debounce, so a
 * keystroke does not fire a request; sorting commits immediately, and every
 * commit resets the page index — a stale page number has no meaning under a
 * new filter or sort.
 */

/** The wire query every server-paged list sends, before resource extras. */
export interface ServerPagedListQuery {
  page: number
  page_size: number
  q?: string
  ordering?: string[]
  [column: string]: unknown
}

/** The paginated envelope every list response in this app shares. */
interface PagedEnvelope {
  count?: number
  results?: unknown[]
}

export interface ServerPagedListConfig<TData extends RowData = RowData> {
  /**
   * The screen's generated `xxxListOptions` factory, handed the wire query.
   * The screen folds its own extras (variant filters) in here and returns
   * the options object the query runs on.
   */
  listOptions: (query: ServerPagedListQuery) => unknown

  /**
   * Map a column filter onto this resource's query params. Return null (or
   * omit the config) for columns that have no backend filter.
   */
  columnFilterParam?: (id: string, value: string) => Record<string, unknown> | null

  /** Rows per page; the backend's My24Pagination default is 20. */
  pageSize?: number

  /** Query-key debounce for the search term and column filters (ms). */
  debounceMs?: number

  /** Stable row identity across pages — the generated client's `id`. */
  getRowId?: (row: TData) => string

  /** Translated at the call site: the toast when the list fails to load. */
  loadError?: string
}

function resolveUpdater<T>(updater: Updater<T>, previous: T): T {
  return typeof updater === 'function'
    ? (updater as (old: T) => T)(previous)
    : updater
}

export function useServerPagedList<TData extends RowData>(config: ServerPagedListConfig<TData>) {
  const debounceMs = config.debounceMs ?? 300

  // ── controlled table state ──────────────────────────────────────────────────

  const sorting = ref<SortingState>([])
  const columnFilters = ref<ColumnFiltersState>([])
  const pagination = ref<PaginationState>({pageIndex: 0, pageSize: config.pageSize ?? 20})
  const globalFilter = ref('')

  /** The search term as typed; commits to the wire debounced. */
  const searchDraft = ref('')

  // ── debounced commits: search term + column filters ─────────────────────────

  watchDebounced(
    () => searchDraft.value,
    (value) => {
      globalFilter.value = value
      pagination.value = {...pagination.value, pageIndex: 0}
    },
    {debounce: debounceMs},
  )

  /** Mirror of `columnFilters` committed to the wire, debounced per keystroke. */
  const committedFilters = ref<ColumnFiltersState>([])

  watchDebounced(
    () => columnFilters.value,
    (value) => {
      committedFilters.value = value
      pagination.value = {...pagination.value, pageIndex: 0}
    },
    {debounce: debounceMs},
  )

  // ── the wire query ──────────────────────────────────────────────────────────

  const wireQuery = computed<ServerPagedListQuery>(() => {
    const query: ServerPagedListQuery = {
      page: pagination.value.pageIndex + 1,
      page_size: pagination.value.pageSize,
    }

    if (globalFilter.value) query.q = globalFilter.value

    const ordering = sorting.value.map((sort) => (sort.desc ? '-' : '') + sort.id)
    if (ordering.length) query.ordering = ordering

    if (config.columnFilterParam) {
      for (const filter of committedFilters.value) {
        const value = filter.value == null ? '' : String(filter.value)
        if (!value) continue
        Object.assign(query, config.columnFilterParam(filter.id, value) ?? {})
      }
    }

    return query
  })

  // The one seam where this composable touches the generated option types:
  // each resource's factory returns a shape only it knows, and restating it
  // here would reject exactly the objects this exists to accept. The cast is
  // the same single one `paged-list-screen.ts` makes. (eslint-disable because
  // the factory return is genuinely unknown at this boundary.)
  //
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listQuery = useQuery(() => ({...(config.listOptions(wireQuery.value) as any), placeholderData: keepPreviousData}))

  const isLoading = computed(() => listQuery.isLoading.value)
  const isFetching = computed(() => listQuery.isFetching.value)
  const error = computed(() => listQuery.error.value as AxiosError | null)
  const rows = computed(() => ((listQuery.data.value as PagedEnvelope | undefined)?.results ?? []) as TData[])
  const count = computed(() => (listQuery.data.value as PagedEnvelope | undefined)?.count ?? 0)

  // The load-error toast belongs to the engine, not the screen: the same
  // watcher fired for every list in `paged-list-screen.ts`, and copy is all
  // a screen can meaningfully change about it.
  const {create} = useToast()

  watch(error, (value) => {
    if (value && config.loadError) errorToast(create, config.loadError)
  })

  /** Re-fetch the current wire query (the toolbar's refresh button). */
  function refresh() {
    listQuery.refetch()
  }

  // ── what the screen's useAppTable call spreads in ───────────────────────────

  /**
   * The controlled-state half of the table options: data, row count, the
   * state getters and the change handlers. Spread it into `useAppTable`
   * alongside the screen's own `columns` (and `key`). The `manual*` flags
   * are defaults of the shared hook, not of this object.
   */
  const tableOptions = {
    data: rows,
    rowCount: count,
    ...(config.getRowId ? {getRowId: config.getRowId} : {}),
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
    // Controlled column-filter state reaches this composable only through
    // this handler: `state.columnFilters` is a getter, so without it the
    // table's update has nowhere to land — no error, just a wire query that
    // never gains the filter. The page reset happens on the debounced commit
    // below, together with the params it produces.
    onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) => {
      columnFilters.value = resolveUpdater(updater, columnFilters.value)
    },
    onGlobalFilterChange: (updater: Updater<string>) => {
      globalFilter.value = resolveUpdater(updater, globalFilter.value)
      pagination.value = {...pagination.value, pageIndex: 0}
    },
    onPaginationChange: (updater: Updater<PaginationState>) => {
      pagination.value = resolveUpdater(updater, pagination.value)
    },
  }

  return {
    tableOptions,
    // state (the screen's search input binds searchDraft; everything else is
    // driven through the table instance)
    searchDraft,
    sorting,
    columnFilters,
    committedFilters,
    pagination,
    globalFilter,
    // the wire, for state panels and tests
    wireQuery,
    // the query
    isLoading,
    isFetching,
    error,
    rows,
    count,
    refresh,
  }
}

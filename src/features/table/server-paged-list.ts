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
import { useUrlQuerySync } from './url-query-sync'

/**
 * See README/ADR.
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
   * Mirror the wire query into the browser's URL bar and restore it from
   * there on load — shareable list views. See `url-query-sync.ts`.
   */
  urlSync?: boolean

  /** Rows per page; the backend's My24Pagination default is 20. */
  pageSize?: number

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
  const debounceMs = 300

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

    for (const filter of committedFilters.value) {
      const value = filter.value == null ? '' : String(filter.value)
      if (!value) continue
      query[filter.id] = value
    }

    return query
  })

  // The URL bar is set up after `wireQuery` (its write side watches it) and
  // before the query (its read side must shape the first request). The
  // params object it returns is the reactive mirror of the address bar.
  if (config.urlSync) {
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
      {defaultPageSize: config.pageSize ?? 20},
    )
  }

  // The one seam where this composable touches the generated option types:
  // each resource's factory returns a shape only it knows, and restating it
  // here would reject exactly the objects this exists to accept. The cast is
  // the same single one the former `paged-list-screen.ts` made. (eslint-disable because
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
  // watcher fired for every list in the former `paged-list-screen.ts`, and copy is all
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
    getRowId: config.getRowId ?? ((row: TData) => String((row as {id: number|string}).id)),
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
    onPaginationChange: (updater: Updater<PaginationState>) => {
      pagination.value = resolveUpdater(updater, pagination.value)
    },
  }

  // clamp page when count arrives (shared ?page=999 self-heals)
  watch(count, (c) => {
    const pageCount = Math.max(Math.ceil(c / pagination.value.pageSize), 1)
    if (pagination.value.pageIndex >= pageCount) pagination.value = {...pagination.value, pageIndex: pageCount - 1}
  })
  return {
    tableOptions,
    searchDraft,
    pagination,
    globalFilter,
    isLoading,
    isFetching,
    count,
    refresh,
  }
}

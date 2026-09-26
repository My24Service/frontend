import { keepPreviousData } from '@tanstack/vue-query'
import type {
  ColumnFiltersState,
  PaginationState,
  RowData,
  SortingState,
  Updater,
} from '@tanstack/vue-table'
import type { AxiosError } from 'axios'
import { useQueryErrorToast } from '@/features/forms'
import { hook } from './table'
import type { PagedEnvelope, ServerPagedListQuery } from './server-paged-list'
import { useUrlQuerySync } from './url-query-sync'

/** What a table needs of a generated resource: a list it can page. Any `Api.<Resource>` whose list is pageable is one. */
export interface PageableResource {
  listOptions(query: ServerPagedListQuery): object
}

/**
 * Where the rows come from: the resource, whose `listOptions` sends the page
 * parameters and every column filter the table holds a value for - or, for a
 * list that sends something else (a mode, a month, another endpoint per
 * route), the options built by hand. One or the other.
 */
type ListSource =
  | {resource: PageableResource; listOptions?: never}
  | {resource?: never; listOptions: (query: ServerPagedListQuery) => unknown}

export type ServerTableOptions<TData extends RowData> = Omit<
  Parameters<typeof hook.useAppTable<TData>>[0],
  'data' | 'rowCount' | 'state' | 'onSortingChange' | 'onColumnFiltersChange' | 'onPaginationChange'
> & ListSource & {

  urlSync?: boolean

  /**
   * Rows a page holds, and so the page count the pager computes. 20 is the
   * API's own default — `My24Pagination.page_size` — and every list that
   * sends a `page_size` can leave this alone. A list whose endpoint pages on
   * a size it cannot be asked for (DRF's own `PageNumberPagination`, which
   * reads the project's `PAGE_SIZE`) has to say what that size is, or the
   * pager counts pages the backend does not have.
   */
  pageSize?: number

  /** Translated at the call site: the toast when the list fails to load. */
  loadError?: string
}

function resolveUpdater<T>(updater: Updater<T>, previous: T): T {
  return typeof updater === 'function'
    ? (updater as (old: T) => T)(previous)
    : updater
}

/** Element-wise filter equality: the commit's echo check without stringifying. */
function sameFilterValues(a: ColumnFiltersState, b: ColumnFiltersState): boolean {
  return a.length === b.length && a.every((filter, index) => {
    const other = b[index]
    return other.id === filter.id && other.value === filter.value
  })
}

export function useServerTable<TData extends RowData>(config: ServerTableOptions<TData>) {
  const debounceMs = 300

  const {resource, listOptions: explicitOptions, urlSync, loadError, pageSize = 20, getRowId, ...tableOptions} = config
  const listOptions = resource ? (query: ServerPagedListQuery) => resource.listOptions(query) : explicitOptions

  const sorting = ref<SortingState>([])
  const columnFilters = ref<ColumnFiltersState>([])
  // 20 is the backend's My24Pagination default.
  const pagination = ref<PaginationState>({pageIndex: 0, pageSize})
  const globalFilter = ref('')

  const searchDraft = ref('')

  const committedFilters = ref<ColumnFiltersState>([])

  /**
   * The drafts at rest: one debounced source commits both the search and the
   * column filters, so a URL restore — which writes the drafts and the
   * committed values together (see useUrlQuerySync apply()) — is already
   * committed when the debounce fires, and the page stays where the URL put
   * it. No stringified echo guard: the commit compares against the committed
   * state piece by piece.
   */
  watchDebounced(
    () => ({ q: searchDraft.value, filters: columnFilters.value }),
    (pending) => {
      let resetPage = false
      if (pending.q !== globalFilter.value) {
        globalFilter.value = pending.q
        resetPage = true
      }
      if (!sameFilterValues(pending.filters, committedFilters.value)) {
        committedFilters.value = pending.filters
        resetPage = true
      }
      if (resetPage) pagination.value = {...pagination.value, pageIndex: 0}
    },
    { debounce: debounceMs, deep: true },
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
      const value = filter.value
      if (value == null || value === '') continue
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
      {defaultPageSize: pageSize},
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

  if (loadError) useQueryErrorToast(error, loadError)

  function refresh() {
    void listQuery.refetch()
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
    /** The uncommitted column filters — a screen may set one without a column (an id the wire knows and the table does not). */
    columnFilters,
    isLoading,
    isFetching,
    count,
    refresh,
    error,
  }
}

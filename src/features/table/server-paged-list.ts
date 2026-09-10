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
import { errorToast } from '@/services/i18n'
import { useUrlQuerySync } from './url-query-sync'

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

interface PagedEnvelope {
  count?: number
  results?: unknown[]
}

interface ServerPagedListConfig<TData extends RowData = RowData> {
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
      {defaultPageSize: 20},
    )
  }

  // The one seam where this composable touches the generated option types:
  // each resource's factory returns a shape only it knows, and restating it
  // here would reject exactly the objects this exists to accept. The cast is
  // intentional: the factory return is genuinely unknown at this boundary.
  //
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listQuery = useQuery(() => ({...(config.listOptions(wireQuery.value) as any), placeholderData: keepPreviousData}))

  const isLoading = computed(() => listQuery.isLoading.value)
  const isFetching = computed(() => listQuery.isFetching.value)
  const error = computed(() => listQuery.error.value as AxiosError | null)
  const rows = computed(() => ((listQuery.data.value as PagedEnvelope | undefined)?.results ?? []) as TData[])
  const count = computed(() => (listQuery.data.value as PagedEnvelope | undefined)?.count ?? 0)

  const {create} = useToast()

  watch(error, (value) => {
    if (value && config.loadError) errorToast(create, config.loadError)
  })

  function refresh() {
    listQuery.refetch()
  }

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
    onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) => {
      columnFilters.value = resolveUpdater(updater, columnFilters.value)
    },
    onPaginationChange: (updater: Updater<PaginationState>) => {
      pagination.value = resolveUpdater(updater, pagination.value)
    },
  }

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

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
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { hook } from './table'
import type { PagedEnvelope, ServerPagedListQuery } from './server-paged-list'
import { useUrlQuerySync } from './url-query-sync'

export type ServerTableOptions<TData extends RowData> = Omit<
  Parameters<typeof hook.useAppTable<TData>>[0],
  'data' | 'rowCount' | 'state' | 'onSortingChange' | 'onColumnFiltersChange' | 'onPaginationChange'
> & {
  listOptions: (query: ServerPagedListQuery) => unknown

  urlSync?: boolean

  /** Translated at the call site: the toast when the list fails to load. */
  loadError?: string
}

function resolveUpdater<T>(updater: Updater<T>, previous: T): T {
  return typeof updater === 'function'
    ? (updater as (old: T) => T)(previous)
    : updater
}

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

  if (loadError) useQueryErrorToast(error, loadError)

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
    /** The uncommitted column filters — a screen may set one without a column (an id the wire knows and the table does not). */
    columnFilters,
    isLoading,
    isFetching,
    count,
    refresh,
    error,
  }
}

import type { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/vue-table'
import { joinArrayItems, scalarText } from '@/features/table/filters'
import type { ServerPagedListQuery } from './server-paged-list'

const RESERVED = new Set(['page', 'page_size', 'q', 'ordering'])

interface UrlSyncState {
  searchDraft: Ref<string>
  globalFilter: Ref<string>
  sorting: Ref<SortingState>
  columnFilters: Ref<ColumnFiltersState>
  committedFilters: Ref<ColumnFiltersState>
  pagination: Ref<PaginationState>
}

export function useUrlQuerySync(
  state: UrlSyncState,
  wireQuery: Ref<ServerPagedListQuery>,
  options: {defaultPageSize: number},
) {
  const params = useUrlSearchParams('hash')

  /**
   * One URL parameter as text. A repeated parameter (`?tag=a&tag=b`) rides
   * the escaped join — the same encoding the select filters and the
   * backend's `ArrayFilter` read — so a value containing a comma survives
   * the round-trip instead of merging with its neighbours.
   */
  function asString(key: string): string {
    const value = params[key]
    if (value == null) return ''
    return Array.isArray(value) ? joinArrayItems(value.map(String)) : String(value)
  }

  function sameFilters(a: ColumnFiltersState, b: ColumnFiltersState): boolean {
    return a.length === b.length && a.every((filter, index) => {
      const other = b[index]
      return other.id === filter.id && other.value === filter.value
    })
  }

  /** Does this query narrow on anything beyond the reserved parameters? */
  function narrows(query: ServerPagedListQuery): boolean {
    return Object.entries(query).some(([key, value]) => (
      !RESERVED.has(key) && value != null && value !== ''
    ))
  }

  /**
   * Whether the filtered view already has a history entry of its own.
   *
   * The address is written with `replaceState` (VueUse's default), so filters
   * never pile up an entry per keystroke — but that also means the list as it
   * was before the first filter is gone, and Back cannot return to it. So the
   * FIRST filter a user sets gets a fresh entry: pushing a copy of the current
   * address here leaves the unfiltered one behind it, and the write that
   * follows replaces the new entry. Every later change replaces again.
   */
  let filterEntryPushed = false

  function apply() {
    const q = asString('q')
    if (state.globalFilter.value !== q) {
      state.globalFilter.value = q
      state.searchDraft.value = q
    }

    const ordering = asString('ordering')
      .split(',')
      .filter(Boolean)
      .map((term) => ({desc: term.startsWith('-'), id: term.startsWith('-') ? term.slice(1) : term}))
    if (JSON.stringify(ordering) !== JSON.stringify(state.sorting.value)) state.sorting.value = ordering

    const page = Number(asString('page') || '1')
    const pageSize = Number(asString('page_size') || String(options.defaultPageSize))
    const next: PaginationState = {
      pageIndex: Number.isFinite(page) && page > 0 ? page - 1 : 0,
      pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : options.defaultPageSize,
    }
    if (next.pageIndex !== state.pagination.value.pageIndex || next.pageSize !== state.pagination.value.pageSize) {
      state.pagination.value = next
    }

    const filters: ColumnFiltersState = Object.entries(params)
      .filter(([key]) => !RESERVED.has(key))
      .map(([key, value]) => ({
        id: key,
        value: Array.isArray(value) ? joinArrayItems(value.map(String)) : String(value ?? ''),
      }))
      .filter((filter) => String(filter.value) !== '')
    if (!sameFilters(filters, state.columnFilters.value)) {
      state.columnFilters.value = filters
      state.committedFilters.value = filters.map((filter) => ({...filter}))
    }
  }

  function write() {
    const query = wireQuery.value

    if (!filterEntryPushed && narrows(query)) {
      filterEntryPushed = true
      window.history.pushState(window.history.state, '', window.location.href)
    }

    const desired: Record<string, string> = {}
    if (query.page !== 1) desired.page = String(query.page)
    if (query.page_size !== options.defaultPageSize) desired.page_size = String(query.page_size)
    if (query.q) desired.q = query.q
    if (query.ordering?.length) desired.ordering = query.ordering.join(',')
    for (const [key, value] of Object.entries(query)) {
      if (RESERVED.has(key)) continue
      // An array wire value rides the escaped join, mirroring `asString`:
      // the read side restores the same text, commas inside values intact.
      const text = Array.isArray(value) ? joinArrayItems(value.map(String)) : scalarText(value)
      if (text !== null) desired[key] = text
    }

    for (const key of Object.keys(params)) {
      if (desired[key] === undefined) delete params[key]
    }
    for (const [key, value] of Object.entries(desired)) {
      if (asString(key) !== value) params[key] = value
    }
  }

  apply()
  watch(wireQuery, write)
  watch(params, apply, {deep: true})

  return params
}

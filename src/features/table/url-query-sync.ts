import { watch } from 'vue'
import type { Ref } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'
import type { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/vue-table'
import type { ServerPagedListQuery } from './server-paged-list'

/**
 * URL ↔ table state sync (two-way, no-op convergent). Details in server-paged-list.ts.
 */
/** The params the sync interprets itself; everything else is a column filter. */
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

  function asString(key: string): string {
    const value = params[key]
    if (value == null) return ''
    return Array.isArray(value) ? value.join(',') : String(value)
  }

  function sameFilters(a: ColumnFiltersState, b: ColumnFiltersState): boolean {
    return a.length === b.length && a.every((filter, index) => {
      const other = b[index]
      return other.id === filter.id && other.value === filter.value
    })
  }

  /** URL → state. Idempotent: only what actually differs is written back. */
  function apply() {
    // The URL holds a committed term, so both halves of the engine's debounce
    // pairing get it directly — no waiting on the search debounce.
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
      .map(([key, value]) => ({id: key, value: Array.isArray(value) ? value.join(',') : String(value ?? '')}))
      .filter((filter) => String(filter.value) !== '')
    if (!sameFilters(filters, state.columnFilters.value)) {
      state.columnFilters.value = filters
      // A distinct copy: the committed mirror must not alias the draft the
      // table's filter inputs keep editing.
      state.committedFilters.value = filters.map((filter) => ({...filter}))
    }
  }

  /** State → URL. Writes only what differs, so it converges to a no-op. */
  function write() {
    const query = wireQuery.value
    const desired: Record<string, string> = {}
    if (query.page !== 1) desired.page = String(query.page)
    if (query.page_size !== options.defaultPageSize) desired.page_size = String(query.page_size)
    if (query.q) desired.q = query.q
    if (query.ordering?.length) desired.ordering = query.ordering.join(',')
    for (const [key, value] of Object.entries(query)) {
      if (RESERVED.has(key) || value === '' || value == null) continue
      desired[key] = String(value)
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

import { watch } from 'vue'
import type { Ref } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'
import type { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/vue-table'
import type { ServerPagedListQuery } from './server-paged-list'

/**
 * The browser's URL bar as a second view of the table state.
 *
 * With `urlSync` on the engine, the wire query is mirrored into the URL
 * (`useUrlSearchParams('hash')` — the app routes under a hash), so a view a
 * user has filtered into shape survives a reload and can be shared as a
 * link. Three directions, one invariant — the URL is the *committed* state:
 *
 * - **restore** — at setup, before the engine's first query, the URL's
 *   params are applied to the state, so the first request already carries
 *   the shared view.
 * - **state → URL** — the wire query is written back as it changes. Params
 *   at their default (`page` 1, `page_size` the configured page size, an
 *   empty search or sort, empty filters) are omitted, so a bare view has a
 *   bare URL. Writes are `replaceState`: a shareable address, not history
 *   spam per keystroke.
 * - **URL → state** — back/forward (and a hand-edited address, via the
 *   `hashchange` listener) apply the URL to the state; the next request
 *   follows.
 *
 * The mirrored query is the engine's own `wireQuery` — the shared grammar's
 * bare-name params (see `server-paged-list.ts`). Where a screen strips a
 * param in its own `listOptions` (the customer list's `ordering` until its
 * schema declares it), the URL still carries the view state the user chose;
 * once the wire carries it too, sharing changes nothing.
 *
 * Every application round-trips through the same grammar, so re-applying
 * what was just written is a no-op — that is what stops the two watchers
 * from feeding each other.
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

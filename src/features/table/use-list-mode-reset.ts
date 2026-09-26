import type { PaginationState } from '@tanstack/vue-table'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

/**
 * For a screen that shows several lists of the same kind by route name
 * (definitive / preliminary / sent): a new list must not inherit a page that
 * may not exist there. The page, page size and search are re-read from the
 * destination route, so an explicit `?page=2&q=` survives the switch and a
 * bare one lands on page one.
 *
 * Runs before the query observer (`flush: 'sync'`), so no request escapes
 * with the previous list's page. The initial URL restoration remains
 * `useServerTable`'s responsibility.
 */
export function useListModeReset(
  route: RouteLocationNormalizedLoaded,
  state: {
    searchDraft: Ref<string>
    globalFilter: Ref<string>
    pagination: Ref<PaginationState>
  },
) {
  watch(() => route.name, () => {
    const page = Number(route.query.page ?? 1)
    const pageSize = Number(route.query.page_size ?? state.pagination.value.pageSize)
    if (typeof route.query.q === 'string') {
      state.searchDraft.value = route.query.q
      state.globalFilter.value = route.query.q
    }
    state.pagination.value = {
      pageIndex: Number.isInteger(page) && page > 0 ? page - 1 : 0,
      pageSize: Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 20,
    }
  }, {flush: 'sync'})
}

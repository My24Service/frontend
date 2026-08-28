import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * What every list in this Slice shares: its page and search term live in the
 * URL, and both fold into the query key reactively, so a navigation re-fetches
 * whether or not TheAppLayout's `:key="$route.fullPath"` remount happens.
 *
 * Copied from the Member Slice's `route-paged-list.ts` (#324) and extended
 * with the Customer list's sort state, which that Slice never had: the legacy
 * Customer list carries `sort_field`/`sort_dir` in the URL, and the sort
 * direction toggles from the column headers. The two parameters are part of
 * the URL contract here — but see `paged-list-screen.ts` for why they do not
 * (yet) ride on the wire.
 */
export function useRoutePagedList() {
  const route = useRoute()
  const router = useRouter()

  /** Always a number, so the generated query sends `page` even for page one. */
  const page = computed(() => Number(route.query.page) || 1)

  /** Undefined when absent, so the `q` parameter is omitted rather than empty. */
  const searchQuery = computed(() =>
    typeof route.query.q === 'string' && route.query.q !== '' ? route.query.q : undefined,
  )

  /** The URL-carried sort, exactly as the legacy screen seeded and pushed it. */
  const sortField = computed(() =>
    typeof route.query.sort_field === 'string' && route.query.sort_field !== ''
      ? route.query.sort_field
      : undefined,
  )
  const sortDir = computed(() => (route.query.sort_dir === 'desc' ? 'desc' : 'asc'))

  /**
   * Put a searched term in the URL. A blank search clears an existing term;
   * either way the page resets, so both `page` and any previous `q` go.
   */
  async function handleSearchTerm(val: string | null) {
    const rest = {...route.query}
    delete rest.page
    delete rest.q

    await router.push({
      query: {
        ...rest,
        ...(val ? {q: val} : {}),
      },
    })
  }

  async function goToPage(target: number | string) {
    await router.push({query: {...route.query, page: String(target)}})
  }

  /**
   * Sort by a column. The legacy screen reset the page on every sort
   * (`setSorting(field, order, true)`), so the pushed query carries page one.
   */
  async function handleSort(field: string, order: 'asc' | 'desc') {
    await router.push({
      query: {...route.query, page: '1', sort_field: field, sort_dir: order},
    })
  }

  return {page, searchQuery, sortField, sortDir, handleSearchTerm, goToPage, handleSort}
}

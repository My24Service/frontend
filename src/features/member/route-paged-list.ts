import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * What every list in this Slice shares: its page and search term live in the
 * URL, and both fold into the query key reactively, so a navigation re-fetches
 * whether or not TheAppLayout's `:key="$route.fullPath"` remount happens.
 *
 * Extracted at #324, when the Member list became the fourth screen to carry
 * these exact lines — the extraction the contract slice's report-back asked
 * for rather than a fourth copy. The per-resource remainder (which endpoint,
 * which fields, which delete flow) deliberately stays inline in each list.
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

  return {page, searchQuery, handleSearchTerm, goToPage}
}

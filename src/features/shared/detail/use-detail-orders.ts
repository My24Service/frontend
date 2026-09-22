import { keepPreviousData } from '@tanstack/vue-query'
import {
  companyBranchDashboardRetrieveOptions,
  equipmentBuildingDashboardRetrieveOptions,
  equipmentEquipmentDashboardRetrieveOptions,
  equipmentLocationDashboardRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Order } from '@/api/types.gen'
import { useQueryErrorToast } from '@/features/forms'
/** What owns the detail page: the three equipment screens' subject, or a branch. */
export type DetailOwnerKind = 'equipment' | 'location' | 'building' | 'branch'

/** The page size the legacy pagination implied, and My24Pagination's default. */
const PER_PAGE = 20

/**
 * The orders block and the four Insights payloads a detail page carries.
 *
 * Equipment, location, building - and now branches - all show "the orders for
 * this thing" plus the same four statistics the customer view charts, so each
 * page reads one bundled dashboard for its own kind: the subject head, one
 * page of its orders, and the four stats blocks. The kind picks the path, so
 * there is no per-kind filter branching - each query is gated rather than
 * chosen in a ternary, because a conditional `useQuery` is not a call the
 * composable can make and a ternary between the options is a union `useQuery`
 * will not accept.
 *
 * `enabled` gates every query at once, for a page whose subject id resolves
 * after setup. It defaults to true, which is what the equipment pages pass
 * by not passing it.
 */
export function useDetailOrders({kind, pk, enabled = true}: {
  kind: DetailOwnerKind
  pk: number
  enabled?: boolean
}) {
  const page = ref(1)
  const search = ref('')

  // The orders page the bundle carries: the tab's own search, resetting to
  // page one as it always has, rides `orders_search` so the tab pages and
  // searches without a second query.
  const ordersQuery = computed(() => ({
    orders_page: page.value,
    ...(search.value ? {orders_search: search.value} : {}),
  }))

  const equipmentBundle = useQuery(() => ({
    ...equipmentEquipmentDashboardRetrieveOptions({path: {id: pk}, query: ordersQuery.value}),
    enabled: kind === 'equipment' && enabled,
    // Paging keeps the page being left on screen rather than blanking it.
    placeholderData: keepPreviousData,
  }))

  const locationBundle = useQuery(() => ({
    ...equipmentLocationDashboardRetrieveOptions({path: {id: pk}, query: ordersQuery.value}),
    enabled: kind === 'location' && enabled,
    placeholderData: keepPreviousData,
  }))

  const buildingBundle = useQuery(() => ({
    ...equipmentBuildingDashboardRetrieveOptions({path: {id: pk}, query: ordersQuery.value}),
    enabled: kind === 'building' && enabled,
    placeholderData: keepPreviousData,
  }))

  const branchBundle = useQuery(() => ({
    ...companyBranchDashboardRetrieveOptions({path: {id: pk}, query: ordersQuery.value}),
    enabled: kind === 'branch' && enabled,
    placeholderData: keepPreviousData,
  }))

  const bundle = kind === 'equipment'
    ? equipmentBundle
    : kind === 'location' ? locationBundle : kind === 'building' ? buildingBundle : branchBundle

  useQueryErrorToast(bundle.error, $trans('Error fetching orders'))

  // The four dashboards answer the same envelope with the same inner shapes,
  // so the page is named once here rather than at each read.
  const ordersPage = computed(() => bundle.data.value?.orders as {results?: Order[], count?: number} | undefined)
  const orders = computed(() => ordersPage.value?.results ?? [])
  const count = computed(() => ordersPage.value?.count ?? 0)
  const isLoading = computed(() => bundle.isLoading.value)
  const isFetching = computed(() => bundle.isFetching.value)

  /**
   * The shape `OrderStats` reads. Null until the bundle has answered, so the
   * charts never render a partial picture as if it were the whole one. The
   * blocks are the same inner shapes the customer dashboard answers with,
   * mapped to the keys the stats component reads.
   */
  const statsData = computed<Record<string, unknown> | undefined>(() => {
    const data = bundle.data.value
    if (!data) return undefined
    return {
      orderTypeStatsData: data.order_types_stats,
      monthsStatsData: data.order_counts_stats,
      orderTypesMonthStatsData: data.order_types_month_stats,
      countsYearOrdertypeStats: data.counts_year_order_type_stats,
    }
  })

  function renderStats() {
    bundle.refetch()
  }

  /** The orders block's own search: it resets to page one, as it always has. */
  function setSearch(value: string) {
    search.value = value
    page.value = 1
  }

  return {
    orders,
    count,
    perPage: PER_PAGE,
    page,
    isLoading,
    isFetching,
    statsData,
    renderStats,
    setSearch,
    refresh: () => bundle.refetch(),
  }
}

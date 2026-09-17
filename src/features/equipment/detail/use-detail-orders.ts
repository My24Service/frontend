import { computed, ref } from 'vue'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import {
  orderOrderAllForEquipmentLocationListOptions,
  orderOrderCountsYearOrderTypeStatsRetrieveOptions,
  orderOrderListOptions,
  orderOrderOrderCountsStatsRetrieveOptions,
  orderOrderOrderTypesMonthStatsRetrieveOptions,
  orderOrderOrderTypesStatsRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Order } from '@/api/types.gen'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans } from '@/services/i18n'

/** What owns the detail page: the three equipment screens' subject, or a branch. */
export type DetailOwnerKind = 'equipment' | 'location' | 'building' | 'branch'

/** The page size the legacy pagination implied, and My24Pagination's default. */
const PER_PAGE = 20

/**
 * The orders block and the four Insights payloads a detail page carries.
 *
 * Equipment, location, building - and now branches - all show "the orders for
 * this thing" plus the same four statistics endpoints narrowed to it, so the
 * reads belong together rather than four times over. Only the filter differs:
 * the orders block reaches equipment and location through
 * `all_for_equipment_location` and building and branch through the plain order
 * list, because a building is only ever reached through its locations'
 * equipment and a branch is the order's own column.
 *
 * The four stats are four requests by contract - the backend serves one
 * payload each - so they run as four queries rather than one serial chain, and
 * `renderStats` refetches them together for the Insights tab.
 *
 * `enabled` gates every query at once, for a page whose subject id resolves
 * after setup. It defaults to true, which is what the equipment pages pass
 * by not passing it.
 *
 * `ordersBranch` narrows the branch page's orders block, and only it: a
 * branch dashboard has no route pk, so its orders read unfiltered (the server
 * pins the employee's scope itself), while its stats still narrow to the
 * employee's own branch through `pk`. Every other kind leaves it out, and the
 * plain-list filter falls back to `pk`.
 */
export function useDetailOrders({kind, pk, enabled = true, ordersBranch = pk}: {
  kind: DetailOwnerKind
  pk: number
  enabled?: boolean
  ordersBranch?: number | null
}) {
  const page = ref(1)
  const search = ref('')

  // A building - and a branch - reach their orders through the plain order
  // list; equipment and a location share `all_for_equipment_location`. The two
  // ops answer with distinct generated types, so each gets its own query -
  // gated rather than chosen in a ternary, because a conditional `useQuery` is
  // not a call the composable can make and a ternary between the two options
  // is a union `useQuery` will not accept.
  //
  // The plain-list filter is the building, or the branch's route pk when the
  // page has one - an employee dashboard has none, and reads unfiltered.
  const listFilter = kind === 'building'
    ? {building: pk}
    : ordersBranch != null ? {branch: ordersBranch} : {}
  const buildingOrdersQuery = useQuery(() => ({
    ...orderOrderListOptions({
      query: {
        page: page.value,
        ...(search.value ? {q: search.value} : {}),
        ...listFilter,
      },
    }),
    enabled: (kind === 'building' || kind === 'branch') && enabled,
    // Paging keeps the page being left on screen rather than blanking it.
    placeholderData: keepPreviousData,
  }))

  const ownerOrdersQuery = useQuery(() => ({
    ...orderOrderAllForEquipmentLocationListOptions({
      query: {
        page: page.value,
        ...(search.value ? {q: search.value} : {}),
        ...(kind === 'equipment' ? {equipment: pk} : {location: pk}),
      },
    }),
    enabled: (kind === 'equipment' || kind === 'location') && enabled,
    placeholderData: keepPreviousData,
  }))

  const ordersQuery = (kind === 'building' || kind === 'branch') ? buildingOrdersQuery : ownerOrdersQuery

  // One filter key per owner kind. The legacy location screen called the
  // *equipment* helpers with a location id here, so its Insights charts showed
  // whatever equipment happened to share that id; the stats endpoints take a
  // `location` filter, which is what this sends.
  const ownerFilter = kind === 'equipment'
    ? {equipment: pk}
    : kind === 'location' ? {location: pk} : kind === 'building' ? {building: pk} : {branch: pk}

  const orderTypeStats = useQuery(() => ({
    ...orderOrderOrderTypesStatsRetrieveOptions({query: ownerFilter}),
    enabled,
  }))
  const orderCountsStats = useQuery(() => ({
    ...orderOrderOrderCountsStatsRetrieveOptions({query: ownerFilter}),
    enabled,
  }))
  const orderTypesMonthStats = useQuery(() => ({
    ...orderOrderOrderTypesMonthStatsRetrieveOptions({query: ownerFilter}),
    enabled,
  }))
  const countsYearOrderTypeStats = useQuery(() => ({
    ...orderOrderCountsYearOrderTypeStatsRetrieveOptions({query: ownerFilter}),
    enabled,
  }))

  const statsQueries = [orderTypeStats, orderCountsStats, orderTypesMonthStats, countsYearOrderTypeStats]

  useQueryErrorToast(ordersQuery.error, $trans('Error fetching orders'))
  useQueryErrorToast(
    computed(() => statsQueries.map((query) => query.error.value).find(Boolean)),
    $trans('Error fetching stats'),
  )

  // The two list ops answer with the same envelope but are distinct generated
  // types, so the page is named once here rather than at each read.
  const page_ = computed(() => ordersQuery.data.value as {results?: Order[], count?: number} | undefined)
  const orders = computed(() => page_.value?.results ?? [])
  const count = computed(() => page_.value?.count ?? 0)
  const isLoading = computed(() => ordersQuery.isLoading.value)
  const isFetching = computed(() => ordersQuery.isFetching.value)

  /**
   * The shape `OrderStats` reads. Null until all four have answered, so the
   * charts never render a partial picture as if it were the whole one.
   */
  const statsData = computed<Record<string, unknown> | undefined>(() => {
    const data = statsQueries.map((query) => query.data.value)
    if (data.some((value) => value === undefined)) return undefined
    return {
      orderTypeStatsData: data[0],
      monthsStatsData: data[1],
      orderTypesMonthStatsData: data[2],
      countsYearOrdertypeStats: data[3],
    }
  })

  function renderStats() {
    for (const query of statsQueries) query.refetch()
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
    refresh: () => ordersQuery.refetch(),
  }
}

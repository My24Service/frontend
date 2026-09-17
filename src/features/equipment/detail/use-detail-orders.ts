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

/** What owns the detail page: the three equipment screens' subject. */
export type DetailOwnerKind = 'equipment' | 'location' | 'building'

/** The page size the legacy pagination implied, and My24Pagination's default. */
const PER_PAGE = 20

/**
 * The orders block and the four Insights payloads a detail page carries.
 *
 * Equipment, location and building all show "the orders for this thing" plus
 * the same four statistics endpoints narrowed to it, so the reads belong
 * together rather than three times over. Only the filter differs: the orders
 * block reaches equipment and location through
 * `all_for_equipment_location` and building through the plain order list,
 * because a building is only ever reached through its locations' equipment.
 *
 * The four stats are four requests by contract - the backend serves one
 * payload each - so they run as four queries rather than one serial chain, and
 * `renderStats` refetches them together for the Insights tab.
 */
export function useDetailOrders({kind, pk}: {kind: DetailOwnerKind, pk: number}) {
  const page = ref(1)
  const search = ref('')

  // A building reaches its orders through the plain order list; equipment and
  // a location share `all_for_equipment_location`. The two ops answer with
  // distinct generated types, so each gets its own query - gated rather than
  // chosen in a ternary, because a conditional `useQuery` is not a call the
  // composable can make and a ternary between the two options is a union
  // `useQuery` will not accept.
  const buildingOrdersQuery = useQuery(() => ({
    ...orderOrderListOptions({
      query: {building: pk, page: page.value, ...(search.value ? {q: search.value} : {})},
    }),
    enabled: kind === 'building',
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
    enabled: kind !== 'building',
    placeholderData: keepPreviousData,
  }))

  const ordersQuery = kind === 'building' ? buildingOrdersQuery : ownerOrdersQuery

  // One filter key per owner kind. The legacy location screen called the
  // *equipment* helpers with a location id here, so its Insights charts showed
  // whatever equipment happened to share that id; the stats endpoints take a
  // `location` filter, which is what this sends.
  const ownerFilter = kind === 'equipment'
    ? {equipment: pk}
    : kind === 'location' ? {location: pk} : {building: pk}

  const orderTypeStats = useQuery(() => orderOrderOrderTypesStatsRetrieveOptions({query: ownerFilter}))
  const orderCountsStats = useQuery(() => orderOrderOrderCountsStatsRetrieveOptions({query: ownerFilter}))
  const orderTypesMonthStats = useQuery(() => orderOrderOrderTypesMonthStatsRetrieveOptions({query: ownerFilter}))
  const countsYearOrderTypeStats = useQuery(() => orderOrderCountsYearOrderTypeStatsRetrieveOptions({query: ownerFilter}))

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

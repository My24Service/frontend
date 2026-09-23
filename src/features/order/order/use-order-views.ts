import type { ColumnFiltersState } from '@tanstack/vue-table'
import { orderFilterSimpleListListOptions } from '@/api/@tanstack/vue-query.gen'
import type { ListMode } from './list-modes'

const USER_FILTER = 'user_filter'

/** One entry of the view control: what the dropdown renders and picks by. */
export interface OrderViewOption {
  /** `all`, `unaccepted`, or `filter:<id>` for a saved filter. */
  id: string
  label: string
}

/** A saved filter as `/order/filter/` lists it. */
export interface SavedFilter {
  id: number
  name: string
}

export interface OrderViewsInput {
  mode: ListMode
  /** The mobile dispatch lists offer no "not accepted" view. */
  mobile: boolean
  filters: SavedFilter[]
  /** The saved filter in force, or null. */
  activeFilterId: number | null
}

/**
 * The views the order list can show, and which ONE of them is active.
 *
 * One source of truth is the whole point. The pills this replaces let the
 * router decide what looked active: `b-nav-item` with `:to` marks itself active
 * on a route-name match, and a saved filter only changes the query, so picking
 * one left "All" highlighted as well. Here the active view is derived from the
 * mode and the filter together, so exactly one view can ever be active.
 *
 * A mode this control does not offer (the mobile dispatch lists) reads as the
 * plain view; it is still exactly one label, and those screens reach their
 * modes through the router, not through this control.
 *
 * Pure on purpose — the composable below is the thin, mountable half.
 */
export function orderViews(input: OrderViewsInput): {views: OrderViewOption[], active: OrderViewOption} {
  const all: OrderViewOption = {id: 'all', label: $trans('All')}
  const unaccepted: OrderViewOption = {id: 'unaccepted', label: $trans('Not accepted')}
  const saved: OrderViewOption[] = input.filters.map((filter) => ({id: `filter:${filter.id}`, label: filter.name}))
  const views = [all, ...(input.mobile ? [] : [unaccepted]), ...saved]

  if (input.mode === 'unaccepted') return {views, active: unaccepted}

  // The saved filters read asynchronously, so an id can be in force before its
  // row has arrived; the plain view stands in until it does.
  const active = saved.find((view) => view.id === `filter:${input.activeFilterId}`)
  return {views, active: active ?? all}
}

/**
 * The order list's view control: the saved filters (`/order/filter/`, the
 * legacy way of narrowing the list) plus the two fixed views, and the routing
 * each pick implies.
 *
 * A saved filter rides the kit as a `user_filter` column filter — a filter
 * without a column, which the kit still commits, mirrors into the address and
 * hands to `listOptions` — and only the plain list takes it
 * (`listOptionsFor` drops it in every other mode), so picking one leaves a mode
 * that does not.
 */
export function useOrderViews(options: {
  mode: Ref<ListMode>
  mobile: Ref<boolean>
  columnFilters: Ref<ColumnFiltersState>
}) {
  const router = useRouter()
  const query = useQuery(orderFilterSimpleListListOptions())
  const filters = computed<SavedFilter[]>(() => query.data.value ?? [])

  const activeFilterId = computed<number | null>(() => {
    const entry = options.columnFilters.value.find((filter) => filter.id === USER_FILTER)
    const value = Number(entry?.value)
    return Number.isInteger(value) && value > 0 ? value : null
  })

  const state = computed(() => orderViews({
    mode: options.mode.value,
    mobile: options.mobile.value,
    filters: filters.value,
    activeFilterId: activeFilterId.value,
  }))

  const plainList = computed<RouteLocationRaw>(() => ({
    name: options.mobile.value ? 'mobile-orders' : 'order-list',
  }))

  function setUserFilter(id: number | null) {
    options.columnFilters.value = [
      ...options.columnFilters.value.filter((filter) => filter.id !== USER_FILTER),
      ...(id == null ? [] : [{id: USER_FILTER, value: String(id)}]),
    ]
  }

  function select(view: OrderViewOption) {
    if (view.id.startsWith('filter:')) {
      const id = Number(view.id.slice('filter:'.length))
      setUserFilter(activeFilterId.value === id ? null : id)
      if (options.mode.value !== 'all') router.push(plainList.value)
      return
    }

    setUserFilter(null)
    router.push(view.id === 'unaccepted' ? {name: 'orders-not-accepted'} : plainList.value)
  }

  return {views: computed(() => state.value.views), active: computed(() => state.value.active), select}
}

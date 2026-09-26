import type { ColumnFiltersState } from '@tanstack/vue-table'
import type { LocationQueryRaw } from 'vue-router'

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
  const route = useRoute()
  const query = useQuery(Api.OrderFilterSimpleList.list.options())
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

  /**
   * The query the target view lands on: everything the address carries now —
   * the column filters, the search term, the sort, the page — minus the saved
   * filter, which each view sets for itself. Changing view is a navigation, so
   * without this the filters in force would be left behind on the old address.
   *
   * The kit's own filters are merged in on top of the address: the list queries
   * from the kit's state, and a navigation is not the only thing that can move
   * between views, so the state is the channel that always holds them.
   *
   * `user_filter` is the one parameter that does not travel: it narrows the
   * plain list only (`listOptionsFor` drops it in every other mode), so a view
   * that does not take it resets it, and a picked saved filter re-adds it.
   */
  function targetQuery(next: number | null): LocationQueryRaw {
    const target: LocationQueryRaw = {...route.query}

    for (const filter of options.columnFilters.value) {
      if (filter.id === USER_FILTER) continue
      if (typeof filter.value === 'string' ? filter.value !== '' : typeof filter.value === 'number' || typeof filter.value === 'boolean') target[filter.id] = String(filter.value)
    }

    delete target.user_filter
    if (next != null) target.user_filter = String(next)

    return target
  }

  function select(view: OrderViewOption) {
    const wasActive = activeFilterId.value
    const picked = view.id.startsWith('filter:') ? Number(view.id.slice('filter:'.length)) : null
    // Picking the view already in force clears it, as the pill did.
    const next = picked == null || picked === wasActive ? null : picked

    // The saved filter is written to the kit's state FIRST, and the address
    // second. The two channels cover the two cases a view change can be: the
    // list stays mounted and keeps querying from its state (the state write is
    // what makes it filter), or it is mounted fresh and reads the address (the
    // navigation is what makes it filter). Writing the state after the
    // navigation would touch a ref the old instance no longer owns.
    options.columnFilters.value = [
      ...options.columnFilters.value.filter((filter) => filter.id !== USER_FILTER),
      ...(next == null ? [] : [{id: USER_FILTER, value: String(next)}]),
    ]

    const query = targetQuery(next)
    if (view.id === 'unaccepted') {
      void router.push({name: 'orders-not-accepted', query})
      return
    }
    // The literal names, not a computed one: the router is typed per route,
    // and a widened RouteName cannot satisfy any single one of them.
    if (options.mobile.value) void router.push({name: 'mobile-orders', query})
    else void router.push({name: 'order-list', query})
  }

  return {views: computed(() => state.value.views), active: computed(() => state.value.active), select}
}

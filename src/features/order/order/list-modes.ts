import {
  orderOrderAllForCustomerNotAcceptedListOptions,
  orderOrderAllForCustomerNotAcceptedListQueryKey,
  orderOrderDispatchListAllListOptions,
  orderOrderDispatchListAllListQueryKey,
  orderOrderDispatchListFinishedListOptions,
  orderOrderDispatchListFinishedListQueryKey,
  orderOrderDispatchListInprogressListOptions,
  orderOrderDispatchListInprogressListQueryKey,
  orderOrderListOptions,
  orderOrderListQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import type { OrderOrderDispatchListAllListData, OrderOrderListData } from '@/api/types.gen'

/**
 * The lists the order list screen can show. Each is its own backend action
 * with its own scoping (the dispatch lists are the mobile app's view of the
 * work, the not-accepted list is a customer user's unconfirmed orders), so
 * the router names the mode and the screen picks the op.
 */
export const LIST_MODES = ['all', 'unaccepted', 'dispatch', 'inprogress', 'finished'] as const

export type ListMode = (typeof LIST_MODES)[number]

export function isListMode(value: unknown): value is ListMode {
  return typeof value === 'string' && (LIST_MODES as readonly string[]).includes(value)
}

/**
 * The query every mode accepts. The dispatch and not-accepted actions
 * declare the plain list's filters but not its `ordering`, `user_filter`,
 * `since`, `order_by` or the equipment/location/building scopes, so the
 * shared shape is theirs; what only the plain list takes is typed apart.
 */
export type OrderListQuery = NonNullable<OrderOrderDispatchListAllListData['query']>

type PlainListOnly = Pick<NonNullable<OrderOrderListData['query']>, 'user_filter' | 'ordering'>

/** Whether a mode's action sorts: only the plain list declares `ordering` so far. */
export function modeSorts(mode: ListMode): boolean {
  return mode === 'all'
}

export function listOptionsFor(mode: ListMode, query: OrderListQuery, plainListOnly: PlainListOnly = {}) {
  // One branch per op rather than a lookup: each generated factory is typed
  // on its own Data, and the switch is what proves the query shapes agree —
  // a param one action stops declaring fails here, not on the wire.
  switch (mode) {
    case 'all':
      return orderOrderListOptions({query: {...query, ...plainListOnly}})
    case 'unaccepted':
      return orderOrderAllForCustomerNotAcceptedListOptions({query})
    case 'dispatch':
      return orderOrderDispatchListAllListOptions({query})
    case 'inprogress':
      return orderOrderDispatchListInprogressListOptions({query})
    case 'finished':
      return orderOrderDispatchListFinishedListOptions({query})
  }
}

export function listQueryKeyFor(mode: ListMode) {
  switch (mode) {
    case 'all':
      return orderOrderListQueryKey()
    case 'unaccepted':
      return orderOrderAllForCustomerNotAcceptedListQueryKey()
    case 'dispatch':
      return orderOrderDispatchListAllListQueryKey()
    case 'inprogress':
      return orderOrderDispatchListInprogressListQueryKey()
    case 'finished':
      return orderOrderDispatchListFinishedListQueryKey()
  }
}

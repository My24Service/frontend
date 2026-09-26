import { baseListParams, type ServerPagedListQuery } from '@/features/table'

/**
 * The lists the order list screen can show. Each is one `?mode=` value on
 * the order list endpoint (the dispatch lists are the mobile app's view of
 * the work, the not-accepted list is a customer user's unconfirmed orders),
 * so the router names the mode and the screen passes it as a param.
 */
export const LIST_MODES = ['all', 'unaccepted', 'dispatch', 'inprogress', 'finished'] as const

export type ListMode = (typeof LIST_MODES)[number]

export function isListMode(value: unknown): value is ListMode {
  return typeof value === 'string' && (LIST_MODES as readonly string[]).includes(value)
}

/**
 * The query the list op accepts: paging, search and ordering, plus each
 * column filter that is set. Only the plain list additionally takes
 * `user_filter` (typed apart below).
 */
export type OrderListQuery = NonNullable<Api.OrderOrderListData['query']>

type PlainListOnly = Pick<NonNullable<Api.OrderOrderListData['query']>, 'user_filter'>

/**
 * The column filters the list forwards, each under its bare name. The
 * company column filters on the owner key rather than the name it shows:
 * `customer_relation`, or `branch` on a tenant that has them.
 */
const COLUMN_FILTERS = [
  'order_id', 'order_name', 'customer_relation', 'branch', 'order_type', 'last_status', 'start_date',
] as const

/**
 * The table kit's query as the list op's: paging, search and ordering, plus
 * each column filter that is set. The kit hands filters over as unknowns
 * (a text box or a select, or the address bar); a blank one is left out.
 */
export function listQueryFrom(query: ServerPagedListQuery): OrderListQuery {
  const filters: Record<string, string> = {}
  for (const name of COLUMN_FILTERS) {
    const value = query[name]
    if (typeof value === 'string' ? value !== '' : typeof value === 'number' || typeof value === 'boolean') filters[name] = String(value)
  }
  return {...baseListParams(query), ...filters}
}

/** The saved filter (`/order/filter/`) a plain-list query names, if a valid id. */
export function userFilterFrom(query: ServerPagedListQuery): PlainListOnly {
  const id = Number(query.user_filter)
  return Number.isInteger(id) && id > 0 ? {user_filter: id} : {}
}

export function listOptionsFor(mode: ListMode, query: OrderListQuery, plainListOnly: PlainListOnly = {}) {
  // One query for every mode: the mode rides `?mode=` on the order list,
  // and only the plain list additionally names a saved filter.
  if (mode === 'all') return Api.OrderOrder.list.options({query: {...query, ...plainListOnly}})
  return Api.OrderOrder.list.options({query: {...query, mode}})
}

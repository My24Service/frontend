import { useQuery } from '@tanstack/vue-query'
import moment from 'moment/min/moment-with-locales'

import { companyDispatchAssignedordersUserListV4RetrieveOptions } from '@/api/@tanstack/vue-query.gen'

/**
 * One assigned order as the dispatch window sends it.
 *
 * Written out rather than taken from the generated `AssignedOrderView`,
 * because this response is the one endpoint in the Slice whose rows the
 * schema documents loosely: `assignedorders` is `Array<unknown>` in
 * `vCompanyDispatchAssignedordersUserListV4RetrieveResponse`, and the board
 * reads a dozen keys off each row. The generated client hands the payload over
 * untransformed, so naming the shape here is what makes the board typed.
 */
export interface DispatchBoardAssignedOrder {
  id: number
  order: DispatchBoardOrder
  /** The date the assignment starts, which is not the order's own date. */
  start_date: string | null
  end_date: string | null
  start_time: string | null
  end_time: string | null
  last_status: string
  /** The assignment's dates as the tenant's date format spells them. */
  date_formatted: string
}

/** The order behind an assignment, as the board's cells read it. */
export interface DispatchBoardOrder {
  id: number
  order_id: string
  order_name: string
  order_city: string | null
  order_type: string
  order_reference: string
  /** The address block the actions modal shows; the board's cells do not read it. */
  order_address?: string
  order_postal?: string
  order_date?: string
  /** Only the order detail carries these two; the board's rows may omit them. */
  order_status?: string
  last_status: string
  orderlines: DispatchOrderLine[]
}

export interface DispatchOrderLine {
  id: number
  product: string
  location: string
}

/** One row of the grid: a user, and what they are on this week. */
export interface DispatchBoardUser {
  user_id: number
  full_name: string
  /**
   * A partner's rows carry a `tenantid_userid` string id and a different set
   * of keys; their assignments are shown, never assigned from here.
   */
  is_partner: boolean
  assignedorders: DispatchBoardAssignedOrder[]
}

/**
 * The board's week, as `start_date` addresses it.
 *
 * The window is one request for the whole grid — the endpoint answers one row
 * per user with that user's assignments in the window — so the board has one
 * query and no per-cell reads.
 *
 * `start_date` defaults to today on the server when it is omitted, which is
 * why the payload's rows cannot be used to address the window again: the board
 * always names the day it asked for.
 */
export function useDispatchWindow(startDate: () => Date | null) {
  const start_date = computed(() => moment(startDate() ?? new Date()).format('YYYY-MM-DD'))

  return useQuery(() => ({
    ...companyDispatchAssignedordersUserListV4RetrieveOptions({query: {start_date: start_date.value}}),
  }))
}

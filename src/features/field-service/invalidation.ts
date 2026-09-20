import type { QueryClient } from '@tanstack/vue-query'
import {
  companyDispatchAssignedordersUserListV4RetrieveQueryKey,
  mobileAssignedorderFinishedListListQueryKey,
  mobileAssignedorderListQueryKey,
  mobileAssignedorderListTimesheetTotalsRetrieveQueryKey,
  mobileTripListQueryKey,
  mobileTripTripAvailabilityDetailRetrieveQueryKey,
} from '@/api/@tanstack/vue-query.gen'

/**
 * The query keys this Slice invalidates, one helper per resource it writes.
 *
 * A write invalidates every query of the resource it changed, including the
 * read models other resources display: an assignment is displayed on the
 * dispatch board *and* on the assigned-order list *and* in the timesheet
 * totals, so all three are refreshed by one assign.
 */

/** The three reads that show assigned orders: the list, the finished list and the timesheet totals. */
export function invalidateAssignedOrderLists(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({queryKey: mobileAssignedorderListQueryKey()}),
    queryClient.invalidateQueries({queryKey: mobileAssignedorderFinishedListListQueryKey()}),
    queryClient.invalidateQueries({queryKey: mobileAssignedorderListTimesheetTotalsRetrieveQueryKey()}),
  ])
}

/** An assign, an unassign or a date change redraws the week board and both assigned-order lists. */
export function invalidateDispatchBoard(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({queryKey: companyDispatchAssignedordersUserListV4RetrieveQueryKey()}),
    invalidateAssignedOrderLists(queryClient),
  ])
}

export function invalidateTripList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({queryKey: mobileTripListQueryKey()})
}

/**
 * The availability detail is a different read model of one trip, so it is its
 * own key: assigning a user to a trip redraws that page and the trip list, but
 * not the whole board.
 */
export function invalidateTripAvailability(queryClient: QueryClient, tripId: number) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: mobileTripTripAvailabilityDetailRetrieveQueryKey({path: {id: tripId}}),
    }),
    invalidateTripList(queryClient),
  ])
}

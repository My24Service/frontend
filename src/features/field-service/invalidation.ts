import type { QueryClient } from '@tanstack/vue-query'
import { companyDispatchAssignedordersUserListV4RetrieveQueryKey } from '@/api/@tanstack/vue-query.gen'

/**
 * The one read this Slice refreshes that the schema cannot derive: the
 * dispatch board is a read model of assigned orders under another resource's
 * path, so an assignment has to name it. The assigned-order reads themselves
 * - the list, the finished list, the timesheet totals - are the resource's own
 * `reads`, so `MobileAssignedorder.invalidate` is those and this adds the one
 * above them.
 */
export function invalidateDispatchBoard(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({queryKey: companyDispatchAssignedordersUserListV4RetrieveQueryKey()}),
    Api.MobileAssignedorder.invalidate(queryClient),
  ])
}

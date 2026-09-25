import type { QueryClient } from '@tanstack/vue-query'

import {
  statuscodeActionListQueryKey,
  statuscodeStatuscodeListQueryKey,
} from '@/api/@tanstack/vue-query.gen'

/**
 * A statuscode carries its actions inline (`Statuscode.actions`), so a write
 * to either resource makes the statuscode list stale; the action list is
 * invalidated with it for any reader that fetches it directly.
 *
 * Named as the two query keys rather than as the two resources' `invalidate`,
 * because a write to one does not stale every read of the other: the
 * autocomplete and the roles query under `statuscode/` are unaffected by an
 * action rename, and refreshing them would be a request nobody asked for.
 */
export async function invalidateStatuscodeLists(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({queryKey: statuscodeStatuscodeListQueryKey()}),
    queryClient.invalidateQueries({queryKey: statuscodeActionListQueryKey()}),
  ])
}

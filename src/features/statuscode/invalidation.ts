import type { QueryClient } from '@tanstack/vue-query'

import {
  statuscodeActionListQueryKey,
  statuscodeStatuscodeListQueryKey,
} from '@/api/@tanstack/vue-query.gen'

/**
 * A statuscode carries its actions inline (`Statuscode.actions`), so a write
 * to either resource makes the statuscode list stale; the action list is
 * invalidated with it for any reader that fetches it directly.
 */
export async function invalidateStatuscodeLists(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({queryKey: statuscodeStatuscodeListQueryKey()}),
    queryClient.invalidateQueries({queryKey: statuscodeActionListQueryKey()}),
  ])
}

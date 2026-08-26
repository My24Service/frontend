import type { QueryClient } from '@tanstack/vue-query'

import { memberMemberListQueryKey } from '@/api/@tanstack/vue-query.gen'

/**
 * The Member list queries, as every variant of the Member list sees them.
 *
 * Invalidation by resource, as settled for contracts in #323: a member write
 * invalidates every variant of the member-list query — all three variants and
 * every page/search combination at once, via partial key matching. The variants
 * are distinct cache *entries* (each folds its own filter into the key), so
 * switching between them can never serve another variant's rows; invalidation
 * spans them because they are one resource.
 *
 * No other resource's display changes when a member write lands, so nothing
 * else is reached — see contract/list-invalidation.ts and
 * module-data-invalidation.ts for the two directions that rule has produced.
 */
export async function invalidateMemberListQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({queryKey: memberMemberListQueryKey()})
}

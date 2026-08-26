import type { QueryClient } from '@tanstack/vue-query'

import { memberGetModuleDataListQueryKey } from '@/api/@tanstack/vue-query.gen'

/**
 * The module-tree read model, invalidated by its writers.
 *
 * **The other half of the cross-resource invalidation decision (#323).** A
 * Module or Module Part write changes what the Contract form displays: its
 * checkbox tree is built from `GET /api/member/get-module-data/`, a different
 * resource's read model. The rule this Slice settled here is that the
 * *writer* invalidates the queries of whatever resource its change makes
 * stale — writes never invalidate other resources' keys from the outside, and
 * readers never poll writers (see contract/list-invalidation.ts for the same
 * decision stated from the reading side).
 *
 * Until #321/#322 nothing displayed this endpoint through vue-query, so no
 * write had anyone to notify; the Contract form is the first consumer.
 */
export async function invalidateModuleDataReadModels(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({queryKey: memberGetModuleDataListQueryKey()})
}

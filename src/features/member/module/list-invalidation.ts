import type { QueryClient } from '@tanstack/vue-query'

import { memberModuleListQueryKey } from '@/api/@tanstack/vue-query.gen'
import { invalidateModuleDataReadModels } from '../module-data-invalidation'

/**
 * The Module list queries, as both of this Slice's screens see them.
 *
 * A write on one screen must be visible on the other without a manual
 * refresh, and vue-query's stale window would otherwise serve a pre-write
 * cache entry for up to 30 seconds after returning to the list. Invalidation
 * with partial key matching covers every page/search variant at once.
 */
export async function invalidateModuleListQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({queryKey: memberModuleListQueryKey()})
  // A module write changes the Contract form's checkbox tree too (#323).
  await invalidateModuleDataReadModels(queryClient)
}

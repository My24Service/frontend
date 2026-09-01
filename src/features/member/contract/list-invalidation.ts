import type { QueryClient } from '@tanstack/vue-query'

import { memberContractListQueryKey } from '@/api/@tanstack/vue-query.gen'

/**
 * The Contract list queries, as every screen displaying contracts sees them.
 *
 * **The cross-resource invalidation decision (#323).** Writes are invalidated
 * by *resource*, not by screen: a contract write invalidates every variant of
 * the contract-list query — partial key matching, so all pages and searches at
 * once — because that one generated query is the only thing any screen should
 * read contracts through. Today its consumers are these two screens; when the
 * Member form is converted (#325), its assignment dropdown reads the same
 * query instead of fetching its own copy, and this invalidation covers it
 * without this file growing a second export.
 *
 * The deliberate negative: contract writes do NOT reach into member or module
 * query keys. Nothing a contract write changes is displayed from those
 * resources, and letting writes invalidate other resources' keys would couple
 * every screen to every other. When a write genuinely changes another
 * resource's display, it is the *writer* that invalidates that read model —
 * see `../module-data-invalidation.ts` for the worked example in the other
 * direction (module writes refreshing the tree this Slice's form displays).
 */
export async function invalidateContractListQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({queryKey: memberContractListQueryKey()})
}

import type { QueryClient } from '@tanstack/vue-query'

import {
  memberGetModuleDataListQueryKey,
  memberModuleListQueryKey,
  memberModulePartListQueryKey,
} from '@/api/@tanstack/vue-query.gen'

// Cross-resource invalidation policy — see member/README.md ledger (#323):
// the writer invalidates what its change makes stale.
// Replaces former list-invalidation modules: member/module/list-invalidation.ts etc.
export async function invalidateModuleDataReadModels(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({queryKey: memberGetModuleDataListQueryKey()})
}

export async function invalidateModuleListQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({queryKey: memberModuleListQueryKey()})
  await invalidateModuleDataReadModels(queryClient)
}

export async function invalidateModulePartListQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({queryKey: memberModulePartListQueryKey()})
  await invalidateModuleDataReadModels(queryClient)
}

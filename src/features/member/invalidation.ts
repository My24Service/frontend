import type { QueryClient } from '@tanstack/vue-query'

import {
  memberContractListQueryKey,
  memberGetModuleDataListQueryKey,
  memberMemberListQueryKey,
  memberModuleListQueryKey,
  memberModulePartListQueryKey,
} from '@/api/@tanstack/vue-query.gen'

/**
 * The reads a module write makes stale that are not its own, named one at a
 * time rather than as resources.
 *
 * A resource's `invalidate` refreshes *every* read under its path, which is
 * the right answer for a write to that resource and too broad here: renaming a
 * module changes the module list, and the member and contract lists that
 * embed the module tree, but nothing else about a member. Naming the three
 * query keys is what says which.
 */
export async function invalidateModuleDataReadModels(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({queryKey: memberGetModuleDataListQueryKey()})
}

function invalidateDerivedModuleReads(queryClient: QueryClient): Promise<unknown>[] {
  return [
    invalidateModuleDataReadModels(queryClient),
    queryClient.invalidateQueries({queryKey: memberMemberListQueryKey()}),
    queryClient.invalidateQueries({queryKey: memberContractListQueryKey()}),
  ]
}

export async function invalidateModuleListQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({queryKey: memberModuleListQueryKey()}),
    ...invalidateDerivedModuleReads(queryClient),
  ])
}

export async function invalidateModulePartListQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({queryKey: memberModulePartListQueryKey()}),
    ...invalidateDerivedModuleReads(queryClient),
  ])
}
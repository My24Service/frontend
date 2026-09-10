import type { QueryClient } from '@tanstack/vue-query'

import {
  memberContractListQueryKey,
  memberGetModuleDataListQueryKey,
  memberMemberListQueryKey,
  memberModuleListQueryKey,
  memberModulePartListQueryKey,
} from '@/api/@tanstack/vue-query.gen'

// Cross-resource invalidation policy — see member/README.md ledger (#323):
// the writer invalidates what its change makes stale.
export async function invalidateModuleDataReadModels(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({queryKey: memberGetModuleDataListQueryKey()})
}

// A module write reaches further than the module screens. The two lists that
// display what a module *means* derive their columns from it in Python — the
// member list's `contract_text` (get_contract_text) and the contract list's
// `modules_text` (get_modules_text) — and neither screen has a module column
// that would otherwise go stale, so nothing but this invalidation refreshes
// them. The reads are independent, so they refresh together rather than one
// after the other.
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
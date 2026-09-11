import type { QueryClient } from '@tanstack/vue-query'

import {
  memberContractListQueryKey,
  memberGetModuleDataListQueryKey,
  memberMemberListQueryKey,
  memberModuleListQueryKey,
  memberModulePartListQueryKey,
} from '@/api/@tanstack/vue-query.gen'

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
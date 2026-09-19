import type { QueryClient } from '@tanstack/vue-query'
import { companyBranchListQueryKey } from '@/api/@tanstack/vue-query.gen'

export function invalidateBranchList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: companyBranchListQueryKey() })
}

import type { QueryClient } from '@tanstack/vue-query'
import { companyBudgetListQueryKey } from '@/api/@tanstack/vue-query.gen'

export function invalidateBudgetList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: companyBudgetListQueryKey() })
}

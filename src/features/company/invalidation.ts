import type { QueryClient } from '@tanstack/vue-query'
import { companyActivityListQueryKey, companyBranchListQueryKey, companyBudgetListQueryKey, companyPictureListQueryKey } from '@/api/@tanstack/vue-query.gen'

export function invalidatePictureList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: companyPictureListQueryKey() })
}

export function invalidateActivityList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: companyActivityListQueryKey() })
}

export function invalidateBranchList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: companyBranchListQueryKey() })
}

export function invalidateBudgetList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: companyBudgetListQueryKey() })
}

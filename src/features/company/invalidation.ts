import type { QueryClient } from '@tanstack/vue-query'
import {
  companyActivityListQueryKey,
  companyBranchListQueryKey,
  companyBudgetListQueryKey,
  companyPartnerListQueryKey,
  companyPartnerRequestReceivedListQueryKey,
  companyPartnerRequestSentListQueryKey,
  companyPictureListQueryKey,
  companyTemplateListQueryKey,
} from '@/api/@tanstack/vue-query.gen'

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

export function invalidatePartnerList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: companyPartnerListQueryKey() })
}

export function invalidatePartnerRequestSentList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: companyPartnerRequestSentListQueryKey() })
}

export function invalidatePartnerRequestReceivedList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: companyPartnerRequestReceivedListQueryKey() })
}

export function invalidateTemplateList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: companyTemplateListQueryKey() })
}

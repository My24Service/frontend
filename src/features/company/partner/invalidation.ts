import type { QueryClient } from '@tanstack/vue-query'
import {
  companyPartnerListQueryKey,
  companyPartnerRequestReceivedListQueryKey,
  companyPartnerRequestSentListQueryKey,
} from '@/api/@tanstack/vue-query.gen'

export function invalidatePartnerList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: companyPartnerListQueryKey() })
}

export function invalidatePartnerRequestSentList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: companyPartnerRequestSentListQueryKey() })
}

export function invalidatePartnerRequestReceivedList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: companyPartnerRequestReceivedListQueryKey() })
}

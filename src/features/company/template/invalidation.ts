import type { QueryClient } from '@tanstack/vue-query'
import { companyTemplateListQueryKey } from '@/api/@tanstack/vue-query.gen'

export function invalidateTemplateList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: companyTemplateListQueryKey() })
}

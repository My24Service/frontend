import type { QueryClient } from '@tanstack/vue-query'
import { companyImportListQueryKey } from '@/api/@tanstack/vue-query.gen'

export function invalidateImportList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: companyImportListQueryKey() })
}

import type { QueryClient } from '@tanstack/vue-query'
import { companyPictureListQueryKey } from '@/api/@tanstack/vue-query.gen'

export function invalidatePictureList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: companyPictureListQueryKey() })
}

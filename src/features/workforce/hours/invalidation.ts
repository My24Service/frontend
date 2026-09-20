import type { QueryClient } from '@tanstack/vue-query'
import { companyTimeRegistrationListQueryKey } from '@/api/@tanstack/vue-query.gen'

/** A correction changes what the window adds up to, so the window is refetched. */
export function invalidateTimeRegistration(queryClient: QueryClient) {
  return queryClient.invalidateQueries({queryKey: companyTimeRegistrationListQueryKey()})
}

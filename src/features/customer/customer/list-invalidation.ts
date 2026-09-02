import type { QueryClient } from '@tanstack/vue-query'

import { customerCustomerListQueryKey } from '@/api/@tanstack/vue-query.gen'

/**
 * The Customer list queries.
 *
 * Invalidation by resource, as settled for contracts in #323: a customer
 * write invalidates every page/search combination of the customer list at
 * once, via partial key matching.
 *
 * No other resource's display changes when a customer write lands — the
 * autocomplete endpoints are one-shot searches, not cached reads — so nothing
 * else is reached. A customer write does refresh the record the detail view
 * shows when that view is open; the detail query is the same resource, and
 * its own screen refetches on navigation, so the list key is the one thing a
 * write must reach from anywhere.
 */
export async function invalidateCustomerListQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({queryKey: customerCustomerListQueryKey()})
}

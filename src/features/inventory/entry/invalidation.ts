import type { QueryClient } from '@tanstack/vue-query'

import { invalidateStock } from '../mutation'

/**
 * What an entry write - a booking in, an edit, a delete - makes stale beyond
 * the entry reads: the order's counts, its products' booked-in totals, and,
 * because the server books a stock mutation per entry, every stock read.
 */
export function invalidateEntryWrites(queryClient: QueryClient) {
  return Promise.all([
    Api.InventoryPurchaseorderEntry.invalidate(queryClient),
    Api.InventoryPurchaseorder.invalidate(queryClient),
    Api.InventoryPurchaseorderMaterial.invalidate(queryClient),
    invalidateStock(queryClient),
  ])
}

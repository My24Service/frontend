import type { QueryClient } from '@tanstack/vue-query'

import {
  customerMaintenanceContractListQueryKey,
  customerMaintenanceEquipmentListQueryKey,
} from '@/api/@tanstack/vue-query.gen'

/**
 * The maintenance-contract and contract-equipment list queries.
 *
 * Invalidation by resource, as settled for contracts in #323: a write
 * invalidates every page/search/filter combination of its resource's list
 * at once, via partial key matching. The contract list key also reaches the
 * customer detail view's contracts table — that table reads the same list
 * resource, filtered to one customer — and the equipment key reaches the
 * contract form's and contract view's equipment tables the same way.
 */
export async function invalidateMaintenanceContractListQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({queryKey: customerMaintenanceContractListQueryKey()})
}

export async function invalidateMaintenanceEquipmentListQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({queryKey: customerMaintenanceEquipmentListQueryKey()})
}

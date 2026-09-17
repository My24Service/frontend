import type { QueryClient } from '@tanstack/vue-query'
import {
  equipmentBuildingListQueryKey,
  equipmentEquipmentListQueryKey,
  equipmentLocationListQueryKey,
} from '@/api/@tanstack/vue-query.gen'

// One helper per resource rather than one for all three: a delete only ever
// invalidates the list it was made from, and the three lists are independent
// caches.

export function invalidateEquipmentList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({queryKey: equipmentEquipmentListQueryKey()})
}

export function invalidateLocationList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({queryKey: equipmentLocationListQueryKey()})
}

export function invalidateBuildingList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({queryKey: equipmentBuildingListQueryKey()})
}

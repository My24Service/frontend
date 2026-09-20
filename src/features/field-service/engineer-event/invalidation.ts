import type { QueryClient } from '@tanstack/vue-query'
import {
  companyEngineerEventTypeListQueryKey,
  companyEngineereventListQueryKey,
} from '@/api/@tanstack/vue-query.gen'

/**
 * The query keys this sub-folder invalidates, one helper per resource it writes.
 *
 * Both lists are this sub-folder's own reads, so the keys live beside the
 * screens rather than in the Slice's root `invalidation.ts` — that file holds
 * the keys the dispatch, trips and hours folders share.
 */

/** An attach-order write redraws the events list, which displays the assigned order. */
export function invalidateEngineerEvents(queryClient: QueryClient) {
  return queryClient.invalidateQueries({queryKey: companyEngineereventListQueryKey()})
}

/** Every event-type write — create, update, delete — redraws the event-type list. */
export function invalidateEngineerEventTypes(queryClient: QueryClient) {
  return queryClient.invalidateQueries({queryKey: companyEngineerEventTypeListQueryKey()})
}

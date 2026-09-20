import type { QueryClient } from '@tanstack/vue-query'
import {
  companyUserSickLeaveAdminAllSickListQueryKey,
  companyUserSickLeaveAdminAllUnconfirmedListQueryKey,
  companyUserSickLeaveAdminListQueryKey,
} from '@/api/@tanstack/vue-query.gen'

/**
 * Every sick-leave read a write in this sub-folder makes stale: the admin list
 * the sick-leave screen shows, and the unconfirmed list the confirmation screen
 * shows. The `all_sick` key is here because the confirmation's own screen reads
 * the same rows through the other list - the two screens answer one question
 * from two angles.
 */
export function invalidateSickLeaveLists(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({queryKey: companyUserSickLeaveAdminListQueryKey()}),
    queryClient.invalidateQueries({queryKey: companyUserSickLeaveAdminAllUnconfirmedListQueryKey()}),
    queryClient.invalidateQueries({queryKey: companyUserSickLeaveAdminAllSickListQueryKey()}),
  ])
}

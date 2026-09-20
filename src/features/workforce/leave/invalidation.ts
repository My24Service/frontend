import type { QueryClient } from '@tanstack/vue-query'
import {
  companyLeaveTypeListQueryKey,
  companyUserLeaveHoursAdminAllNotAcceptedListQueryKey,
  companyUserLeaveHoursAdminListQueryKey,
} from '@/api/@tanstack/vue-query.gen'

/**
 * The three reads a leave write makes stale: the admin list the leave list
 * shows, the unaccepted list the requests screen shows, and the leave-type list
 * the form and the types screen show. Every write in this sub-folder goes
 * through one of these, so the invalidation lives here rather than at each
 * call site.
 */
export function invalidateLeaveLists(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({queryKey: companyUserLeaveHoursAdminListQueryKey()}),
    queryClient.invalidateQueries({queryKey: companyUserLeaveHoursAdminAllNotAcceptedListQueryKey()}),
  ])
}

export function invalidateLeaveTypeList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({queryKey: companyLeaveTypeListQueryKey()})
}

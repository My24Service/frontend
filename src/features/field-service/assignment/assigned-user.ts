import type { AssignedUserInfo } from '@/api/types.gen'

/** A user as the board, the picker and the search modal identify one. */
export interface AssignedUser {
  user_id: number
  full_name: string
}

/**
 * Who is already on the selected orders, flattened across them.
 *
 * Deliberately not de-duplicated: a user on two of the selected orders is
 * listed twice, which is what the legacy board did and what tells the planner
 * how many orders that user is already committed to. A row whose `user_id` is
 * null is dropped rather than carried as a null id — no id can match it, so
 * the only thing it could reach is a path parameter that must be a number.
 */
export function assignedUsersOf(
  orders: readonly {assigned_user_info: readonly AssignedUserInfo[]}[],
): AssignedUser[] {
  const users: AssignedUser[] = []

  for (const order of orders) {
    for (const info of order.assigned_user_info) {
      if (info.user_id === null) continue
      users.push({user_id: info.user_id, full_name: info.full_name})
    }
  }

  return users
}

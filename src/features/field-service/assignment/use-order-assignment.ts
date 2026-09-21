import { useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  mobileAssignUserCreateMutation,
  mobileUnassignUserCreateMutation,
} from '@/api/@tanstack/vue-query.gen'
import type { AssignOrdersResponse } from '@/api/types.gen'
import { invalidateDispatchBoard } from '../invalidation'

/**
 * Putting an order on a user's planning and taking it off again.
 *
 * Both directions are one POST per user, which is the wire the endpoints
 * declare: `assign-user/{id}/` takes the user in the path and the orders in the
 * body, and `unassign-user/{id}/` takes one order. The board assigns to every
 * selected user in turn, so the loop belongs here rather than in the screen.
 *
 * `order_ids` is a comma-separated list of the **order's own `order_id`**, not
 * its pk: the view resolves each entry with `Order.objects.get(order_id=...)`
 * (my24service `apps/mobile/views.py:63-67`), which is also what the legacy
 * board sent.
 */
export function useOrderAssignment() {
  const queryClient = useQueryClient()

  const assignMutation = useMutation({...mobileAssignUserCreateMutation()})
  const unassignMutation = useMutation({...mobileUnassignUserCreateMutation()})

  /**
   * Assign one order set to each of `userIds`, sequentially: a failure on the
   * second user must leave the first user's assignment in place and reported,
   * which is what a rejected promise mid-loop does.
   *
   * The endpoint's answers are returned, one per user: `assigned_data` maps an
   * order's own `order_id` to the assigned order it became, which is the id the
   * engineer-event modal attaches to the event. The board ignores them.
   */
  async function assignOrders(userIds: readonly number[], orderIds: readonly string[], notifyUser: boolean) {
    const responses: AssignOrdersResponse[] = []
    for (const userId of userIds) {
      responses.push(await assignMutation.mutateAsync({
        path: {id: userId},
        body: {order_ids: orderIds.join(',')},
        ...(notifyUser ? {query: {notify_user: '1'}} : {}),
      }))
    }

    await invalidateDispatchBoard(queryClient)

    return responses
  }

  /**
   * Take one user off one order, and report what the backend answered.
   *
   * The answer is returned so the screen can tell a refusal apart from a
   * removal: a zero `result` is the backend refusing — the engineer has
   * booked hours or materials on the order — while a rejected promise is
   * the request itself failing.
   */
  async function unassignOrder(userId: number, orderPk: number) {
    const result = await unassignMutation.mutateAsync({path: {id: userId}, body: {order_pk: orderPk}})

    await invalidateDispatchBoard(queryClient)

    return result
  }

  const isPending = computed(() => assignMutation.isPending.value || unassignMutation.isPending.value)

  return {assignOrders, unassignOrder, isPending}
}

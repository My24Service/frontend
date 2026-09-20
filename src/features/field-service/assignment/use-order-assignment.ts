import { useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  mobileAssignUserCreateMutation,
  mobileUnassignUserCreateMutation,
} from '@/api/@tanstack/vue-query.gen'
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
   */
  async function assignOrders(userIds: readonly number[], orderIds: readonly string[], notifyUser: boolean) {
    for (const userId of userIds) {
      await assignMutation.mutateAsync({
        path: {id: userId},
        body: {order_ids: orderIds.join(',')},
        ...(notifyUser ? {query: {notify_user: '1'}} : {}),
      })
    }

    await invalidateDispatchBoard(queryClient)
  }

  async function unassignOrder(userId: number, orderPk: number) {
    await unassignMutation.mutateAsync({path: {id: userId}, body: {order_pk: orderPk}})

    await invalidateDispatchBoard(queryClient)
  }

  const isPending = computed(() => assignMutation.isPending.value || unassignMutation.isPending.value)

  return {assignOrders, unassignOrder, isPending}
}

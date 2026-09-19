import { mobileAssignUserCreateMutation, mobileUnassignUserCreateMutation } from '@/api/@tanstack/vue-query.gen'
import type { AssignedUserInfo, EngineerForSelect } from '@/api/types.gen'
import { $trans, infoToast } from '@/services/i18n'
import { useEngineerOptions } from './use-order-pickers'

/** The backend refused to unassign: the engineer has booked hours or materials. */
export class UnassignRefused extends Error {}

/**
 * The engineers on an order, staged like the child rows: the ones picked to
 * assign and the ones marked to unassign wait for the save, then replay
 * against the saved order — unassignments first, so a refusal stops the
 * save before anyone new is notified.
 */
export function useEngineerAssignment() {
  const {create} = useToast()
  const {engineers} = useEngineerOptions(() => true)

  const selected = ref<EngineerForSelect[]>([])
  const removed = ref<AssignedUserInfo[]>([])

  const isRemoved = (engineer: AssignedUserInfo) => removed.value.includes(engineer)

  function unassign(engineer: AssignedUserInfo) {
    if (!isRemoved(engineer)) removed.value.push(engineer)
  }

  /** Forget what was staged (a load or a discard). */
  function reset() {
    selected.value = []
    removed.value = []
  }

  const assignMutation = useMutation({...mobileAssignUserCreateMutation()})
  const unassignMutation = useMutation({...mobileUnassignUserCreateMutation()})

  async function replay(orderId: number, orderCode: string) {
    const refused: string[] = []
    for (const engineer of [...removed.value]) {
      if (engineer.user_id !== null) {
        const result = await unassignMutation.mutateAsync({path: {id: engineer.user_id}, body: {order_pk: orderId}})
        // A zero result is the backend refusing: the engineer has booked hours
        // or materials on the order.
        if (!result.result) refused.push(`${engineer.full_name} ${$trans('has booked hours or materials')}`)
      }
      // Drop it as it is handled: a replay that runs again after a later step
      // failed must not re-attempt an unassignment the backend already took.
      removed.value = removed.value.filter((entry) => entry !== engineer)
    }
    if (refused.length) throw new UnassignRefused(refused.join(', '))

    const assigning = selected.value.length > 0
    while (selected.value.length) {
      const engineer = selected.value[0]
      await assignMutation.mutateAsync({path: {id: engineer.user_id}, query: {notify_user: '1'}, body: {order_ids: orderCode}})
      selected.value = selected.value.filter((entry) => entry !== engineer)
    }
    if (assigning) infoToast(create, $trans('Assigned'), $trans('Order assigned'))
  }

  return {engineers, selected, isRemoved, unassign, reset, replay}
}

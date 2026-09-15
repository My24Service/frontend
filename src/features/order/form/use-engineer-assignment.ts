import { ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

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
    for (const engineer of removed.value) {
      if (engineer.user_id === null) continue
      const result = await unassignMutation.mutateAsync({path: {id: engineer.user_id}, body: {order_pk: orderId}})
      // A zero result is the backend refusing: the engineer has booked hours
      // or materials on the order.
      if (!result.result) refused.push(`${engineer.full_name} ${$trans('has booked hours or materials')}`)
    }
    removed.value = []
    if (refused.length) throw new UnassignRefused(refused.join(', '))

    for (const engineer of selected.value) {
      await assignMutation.mutateAsync({path: {id: engineer.user_id}, query: {notify_user: '1'}, body: {order_ids: orderCode}})
    }
    if (selected.value.length) infoToast(create, $trans('Assigned'), $trans('Order assigned'))
    selected.value = []
  }

  return {engineers, selected, isRemoved, unassign, reset, replay}
}

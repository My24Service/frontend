
/**
 * The acceptance both order forms post: accepting after a save, and
 * rejecting straight from the header (which leaves the form). The two
 * forms' mutations, copy and reject-and-leave flow are identical; only
 * the `canAccept` read that shows the buttons differs, and that stays
 * with the caller.
 */
export function useOrderAcceptance(id: Ref<number>, cancelled: () => void) {
  const {create} = useToast()
  const acceptMutation = useMutation({...Api.OrderOrder.extras.setOrderAcceptedCreate.mutation()})
  const rejectMutation = useMutation({...Api.OrderOrder.extras.setOrderRejectedCreate.mutation()})

  async function accept(orderId: number) {
    await acceptMutation.mutateAsync({path: {id: orderId}})
    infoToast(create, $trans('Accepted'), $trans('Order has been accepted'))
  }

  async function reject() {
    try {
      await rejectMutation.mutateAsync({path: {id: id.value}})
      cancelled()
    } catch {
      errorToast(create, $trans('Error rejecting order'))
    }
  }

  return {acceptMutation, rejectMutation, accept, reject}
}

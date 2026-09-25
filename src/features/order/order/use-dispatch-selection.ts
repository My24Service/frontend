
/**
 * What the dispatch screen needs of a picked order: its ids, and who is
 * already on it (listed there as already assigned).
 */
export type SelectedOrder = Pick<Api.Order, 'id' | 'order_id' | 'assigned_user_info'>

/**
 * The orders picked on the mobile dispatch lists, to hand to the dispatch
 * screen in one go. The store owns the pick so it survives the navigation
 * there and back; this reads it and writes additions and removals back.
 */
export function useDispatchSelection() {
  const router = useRouter()
  const mainStore = useMainStore()

  const selected = computed<SelectedOrder[]>(() => {
    const orders = mainStore.getAssignOrders
    return Array.isArray(orders) ? orders : []
  })

  function select(order: SelectedOrder) {
    if (selected.value.some((entry) => entry.id === order.id)) return
    mainStore.setAssignOrders([...selected.value, {
      id: order.id,
      order_id: order.order_id,
      assigned_user_info: order.assigned_user_info,
    }])
  }

  function remove(index: number) {
    mainStore.setAssignOrders(selected.value.filter((_order, i) => i !== index))
  }

  function assign() {
    // `/mobile/dispatch/:assignModeProp?` — the dispatch screen JSON.parses the segment.
    router.push({name: 'mobile-dispatch', params: {assignModeProp: 'true'}})
  }

  return {selected, select, remove, assign}
}

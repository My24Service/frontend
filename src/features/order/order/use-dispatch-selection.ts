import type { Order } from '@/api/types.gen'
import { useMainStore } from '@/stores/main'

export type SelectedOrder = Pick<Order, 'id' | 'order_id'>

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
    mainStore.setAssignOrders([...selected.value, {id: order.id, order_id: order.order_id}])
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

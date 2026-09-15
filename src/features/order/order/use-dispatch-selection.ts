import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import type { Order } from '@/api/types.gen'
import { useMainStore } from '@/stores/main'

export type SelectedOrder = Pick<Order, 'id' | 'order_id'>

/**
 * The orders picked on the mobile dispatch lists, to hand to the dispatch
 * screen in one go. The pick lives in the store so it survives the
 * navigation there and back; this mirrors it and adds, removes and hands
 * over.
 */
export function useDispatchSelection() {
  const router = useRouter()
  const mainStore = useMainStore()

  const selected = ref<SelectedOrder[]>(
    Array.isArray(mainStore.getAssignOrders) ? [...mainStore.getAssignOrders] : [],
  )

  watch(selected, (orders) => mainStore.setAssignOrders(orders), {deep: true})

  function select(order: SelectedOrder) {
    if (selected.value.some((entry) => entry.id === order.id)) return
    selected.value = [...selected.value, {id: order.id, order_id: order.order_id}]
  }

  function remove(index: number) {
    selected.value = selected.value.filter((_order, i) => i !== index)
  }

  function assign() {
    mainStore.setAssignOrders(selected.value)
    // `/mobile/dispatch/:assignModeProp?` — the dispatch screen JSON.parses the segment.
    router.push({name: 'mobile-dispatch', params: {assignModeProp: 'true'}})
  }

  return {selected, select, remove, assign}
}

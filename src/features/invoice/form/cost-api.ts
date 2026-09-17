import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { CostTypeEnum, OrderCostRequest, PatchedOrderCostRequest } from '@/api/types.gen'
import {
  orderCostListOptions, orderCostListQueryKey, orderCostCreateMutation,
  orderCostPartialUpdateMutation, orderCostDestroyMutation,
} from '@/api/@tanstack/vue-query.gen'

export function useCostApi() {
  const queryClient = useQueryClient()
  const create = useMutation(orderCostCreateMutation())
  const update = useMutation(orderCostPartialUpdateMutation())
  const destroy = useMutation(orderCostDestroyMutation())

  async function listCosts(orderId: number, costType: CostTypeEnum) {
    const query = { order: orderId, cost_type: costType }
    await queryClient.invalidateQueries({ queryKey: orderCostListQueryKey({ query }), refetchType: 'none' })
    return queryClient.fetchQuery(orderCostListOptions({ query }))
  }

  return {
    listCosts,
    createCost: (body: OrderCostRequest) => create.mutateAsync({ body }),
    updateCost: (id: number, body: PatchedOrderCostRequest) => update.mutateAsync({ path: { id }, body }),
    deleteCost: (id: number) => destroy.mutateAsync({ path: { id } }),
  }
}

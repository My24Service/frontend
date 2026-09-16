import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import {
  orderOrderRetrieveOptions,
  orderOrderRetrieveQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import type { OrderDetail, OrderLine } from '@/api/types.gen'

/**
 * One order detail, addressed by primary key (the app's own `order-view`
 * route) or by uuid (`order-detail`, the address an e-mail carries). Both
 * ride the one retrieve endpoint, which answers the full detail either way.
 */
export type OrderDetailRecord = OrderDetail

/** The detail is always the full one; kept so call sites read unchanged. */
export function asFullDetail(order: OrderDetailRecord): OrderDetail | null {
  return order
}

export interface OrderAddress {
  pk?: string | number | null
  uuid?: string | null
}

export function orderDetailAddress(address: OrderAddress): string {
  return address.pk != null ? String(address.pk) : String(address.uuid)
}

export function orderDetailQueryKey(address: OrderAddress) {
  return orderOrderRetrieveQueryKey({path: {id: orderDetailAddress(address)}})
}

export function useOrderDetail(address: MaybeRefOrGetter<OrderAddress>) {
  const query = useQuery(() => ({
    ...orderOrderRetrieveOptions({path: {id: orderDetailAddress(toValue(address))}}),
    enabled: toValue(address).pk != null || toValue(address).uuid != null,
  }))

  const order = computed<OrderDetailRecord | undefined>(() => query.data.value)
  const error = computed(() => query.error.value)

  function refetch() {
    return query.refetch()
  }

  return {order, error, refetch}
}

/**
 * With equipment enabled, an orderline that names a piece of equipment (and
 * its location) shows those names rather than the free-text product and
 * location the line was typed with.
 */
export function displayOrderlines(orderlines: OrderLine[], usesEquipment: boolean): OrderLine[] {
  if (!usesEquipment) return orderlines
  return orderlines.map((line) => ({
    ...line,
    location: line.equipment_location_view?.name || line.location,
    product: line.equipment_view?.name || line.product,
  }))
}

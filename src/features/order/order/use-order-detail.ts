import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import {
  orderOrderDetailRetrieveOptions,
  orderOrderDetailRetrieveQueryKey,
  orderOrderRetrieveOptions,
  orderOrderRetrieveQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import type { OrderDetail, OrderDetailPublic, OrderLine } from '@/api/types.gen'

/**
 * The two ways an order detail is addressed: by primary key (the app's own
 * `order-view` route) and by uuid (`order-detail`, the address an e-mail
 * carries). They are two backend actions with two response serializers;
 * `OrderDetailPublic` is the narrower one, so the union's common fields are
 * what a screen may rely on without narrowing.
 */
export type OrderDetailRecord = OrderDetail | OrderDetailPublic

export interface OrderAddress {
  pk?: string | number | null
  uuid?: string | null
}

export function orderDetailQueryKey(address: OrderAddress) {
  return address.pk != null
    ? orderOrderRetrieveQueryKey({path: {id: Number(address.pk)}})
    : orderOrderDetailRetrieveQueryKey({path: {id: String(address.uuid)}})
}

export function useOrderDetail(address: MaybeRefOrGetter<OrderAddress>) {
  const byPk = computed(() => toValue(address).pk != null)

  // Two queries, one enabled: `useQuery` types its options as one shape, and
  // the two retrieve ops answer with different serializers.
  const pkQuery = useQuery(() => ({
    ...orderOrderRetrieveOptions({path: {id: Number(toValue(address).pk)}}),
    enabled: byPk.value,
  }))
  const uuidQuery = useQuery(() => ({
    ...orderOrderDetailRetrieveOptions({path: {id: String(toValue(address).uuid)}}),
    enabled: !byPk.value,
  }))

  const order = computed<OrderDetailRecord | undefined>(() =>
    byPk.value ? pkQuery.data.value : uuidQuery.data.value,
  )
  const error = computed(() => (byPk.value ? pkQuery.error.value : uuidQuery.error.value))

  function refetch() {
    return byPk.value ? pkQuery.refetch() : uuidQuery.refetch()
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

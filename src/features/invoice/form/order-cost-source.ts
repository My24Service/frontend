import * as v from 'valibot'

import type { CostCollectionSource, CostRow } from '@/features/costing'

/**
 * The invoice's half of the shared cost machinery: its costs hang off an
 * order, its replace-set is `/api/order/cost/order/{order_id}/{cost_type}/`,
 * and the row that goes on the wire is `vOrderCostRowRequest`.
 *
 * The order and cost type travel in the URL; totals are priced by the server
 * and never sent.
 */
export function useOrderCostSource(
  orderPk: Readonly<Ref<number | null | undefined>>,
  costType: () => Api.CostTypeEnum,
): CostCollectionSource {
  const replaceMutation = useMutation(Api.OrderCost.extras.orderCreate.mutation())
  return {
    listOptions: () => orderPk.value == null
      ? null
      : Api.OrderCost.list.options({ query: { order: orderPk.value, cost_type: costType() } }),
    replace: (path, body) => replaceMutation.mutateAsync({
      path: path as { order_id: string; cost_type: Api.CostTypeEnum },
      body,
    }) as unknown as Promise<readonly CostRow[]>,
    replacePath: () => {
      const order = orderPk.value
      if (order == null) throw new Error('An order is required to save costs')
      return { order_id: String(order), cost_type: costType() }
    },
    // Parsed through the endpoint's own request component rather than
    // annotated: the row's `price_currency` is a plain string here (it comes
    // from the dineros the panel calculates with) while the endpoint takes one
    // of three, so the generated component is what narrows it - and it is the
    // same schema the specs' seam validates a stub against.
    rowBody: (row: CostRow) => v.parse(schemas.vOrderCostRowRequest, {
      ...(row.id == null ? {} : { id: row.id }),
      user: row.user ?? null,
      user_full_name: row.user_full_name ?? null,
      material: row.material ?? null,
      amount_int: row.amount_int == null ? null : Number(row.amount_int),
      amount_decimal: row.amount_decimal == null ? null : String(row.amount_decimal),
      amount_duration: row.amount_duration == null ? null : String(row.amount_duration),
      price: row.price,
      vat_type: String(row.vat_type),
      // The currency the row is priced in: the server prices vat and total from
      // `price` in this currency, and without the key the column keeps its own
      // default, which relabels a USD or GBP tenant's amounts as EUR. Sent only
      // when the row has one - the field rejects null.
      ...(row.price_currency ? { price_currency: row.price_currency } : {}),
    }),
  }
}

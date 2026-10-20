import * as v from 'valibot'

import type { CostCollectionSource, CostRow } from '@/features/costing'

/**
 * The quotation's half of the shared cost machinery: its costs hang off a
 * quotation and one of its chapters, and the replace-set is
 * `/api/quotation/cost/quotation/{quotation_id}/{cost_type}/?chapter=<id>`.
 *
 * The chapter scope is load-bearing, not incidental: "absent from the list"
 * means "delete", and a panel only ever holds one chapter's rows, so an
 * unscoped save would delete every other chapter's costs of the same type.
 *
 * Unlike the order twin, the quotation endpoint does not price the rows
 * server-side, so the panel's own `vat` and `total` are part of the row, like
 * the legacy `costRow` in `quotation_form/mixin.js` sent them.
 */
export function useQuotationCostSource(
  quotationPk: Readonly<Ref<number | null | undefined>>,
  chapterId: Readonly<Ref<number | null | undefined>>,
  costType: () => Api.CostTypeEnum,
): CostCollectionSource {
  const replaceMutation = useMutation(Api.QuotationCost.extras.quotationCreate.mutation())
  return {
    listOptions: () => quotationPk.value == null || chapterId.value == null
      ? null
      : Api.QuotationCost.list.options({
        query: { quotation: quotationPk.value, chapter: chapterId.value, cost_type: costType() },
      }),
    replace: (path, body) => replaceMutation.mutateAsync({
      path: path as { quotation_id: string; cost_type: string },
      query: chapterId.value == null ? undefined : { chapter: chapterId.value },
      body,
    }) as unknown as Promise<readonly CostRow[]>,
    replacePath: () => {
      const quotation = quotationPk.value
      if (quotation == null) throw new Error('A quotation is required to save costs')
      return { quotation_id: String(quotation), cost_type: costType() }
    },
    // Parsed through the endpoint's own request component rather than
    // annotated: the row's `price_currency` is a plain string here (it comes
    // from the dineros the panel calculates with) while the endpoint takes one
    // of three, so the generated component is what narrows it - and it is the
    // same schema the specs' seam validates a stub against.
    rowBody: (row: CostRow) => v.parse(schemas.vQuotationCostRowRequest, {
      ...(row.id == null ? {} : { id: row.id }),
      chapter: chapterId.value ?? row.chapter ?? null,
      user: row.user ?? null,
      material: row.material ?? null,
      amount_int: row.amount_int == null ? null : Number(row.amount_int),
      amount_decimal: row.amount_decimal == null ? null : String(row.amount_decimal),
      amount_duration: row.amount_duration == null ? null : String(row.amount_duration),
      price: row.price,
      vat_type: String(row.vat_type),
      vat: row.vat,
      total: row.total,
      // The currency each amount is in. The server reads the companion off the
      // raw row and otherwise keeps the column's default (EUR), so dropping it
      // relabels a USD or GBP tenant's costs. Only sent when the row has one:
      // the field rejects null, and omitting the key keeps the server's default.
      ...(row.price_currency ? { price_currency: row.price_currency } : {}),
      ...(row.vat_currency ? { vat_currency: row.vat_currency } : {}),
      ...(row.total_currency ? { total_currency: row.total_currency } : {}),
    }),
  }
}

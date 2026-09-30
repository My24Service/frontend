import * as v from 'valibot'

import {
  type FieldErrors,
  type FieldLabels,
  writeContract,
} from '@/features/forms'

/**
 * The form's own state: the three fields this form owns. The record's
 * `external_identifier` is not on this form, so an edit leaves it alone.
 */
export type StockLocationFormValues = {
  name: string
  identifier: string
  show_in_stats: boolean
}

export type StockLocationFieldErrors = FieldErrors<keyof StockLocationFormValues>

/** A blank stock location. */
export function emptyStockLocation(): StockLocationFormValues {
  return {name: '', identifier: '', show_in_stats: false}
}

/** The fetched record as form values. */
export function stockLocationFromRecord(record: Api.InventoryStockLocation.Record): StockLocationFormValues {
  return {
    name: record.name ?? '',
    identifier: record.identifier ?? '',
    show_in_stats: record.show_in_stats ?? false,
  }
}

export const FIELD_LABELS = {
  name: () => $trans('Name'),
  identifier: () => $trans('Identifier'),
} as const satisfies FieldLabels<keyof StockLocationFormValues>

const body = Api.InventoryStockLocation.create.body.entries

/**
 * The create body with a name that must be given. The request declares it
 * nullish with no minimum, so a blank name passes the generated schema; a
 * stock location needs one. `v.unwrap` drops the null and keeps the maximum
 * codegen put underneath. Recorded in `docs/schema-strengthenings.md`.
 */
const stockLocationFormSchema = v.object({
  ...body,
  name: v.pipe(v.unwrap(body.name), v.minLength(1)),
})

/**
 * Every write validates against the strengthened create body: the form saves
 * the whole stock location it owns. The patch body it sends on an edit is a
 * superset of that.
 */
export const stockLocationWrite = writeContract(Api.InventoryStockLocation, {
  validateWith: stockLocationFormSchema,
  labels: FIELD_LABELS,
})

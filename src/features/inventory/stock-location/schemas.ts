import * as v from 'valibot'

import {
  fieldsFromRecord,
  type FieldErrors,
  type FieldLabels,
  writeContract,
} from '@/features/forms'
import { formDefaults } from '@/models/schema'

const body = Api.InventoryStockLocation.create.body

/**
 * The three fields this form owns, picked from the create body: the form saves
 * the whole stock location it owns. The record's `external_identifier` is not
 * on this form, so an edit leaves it alone.
 *
 * The name is piped with a minimum. Case 1 (`docs/schema-strengthenings.md`
 * entry 10): the request declares it nullish with no minimum, so a blank name
 * passes the generated schema, and a stock location needs one. `v.unwrap`
 * drops the null and keeps the maximum codegen put underneath.
 */
const stockLocationFormSchema = v.object({
  ...v.pick(body, ['name', 'identifier', 'show_in_stats']).entries,
  name: v.pipe(v.unwrap(body.entries.name), v.minLength(1)),
})

/** The form's own state: the picked fields, as the schema takes them. */
export type StockLocationFormValues = Required<v.InferInput<typeof stockLocationFormSchema>>

export type StockLocationFieldErrors = FieldErrors<keyof StockLocationFormValues>

/**
 * A blank stock location. The identifier input starts at `''` rather than the
 * null a nullish entry blanks to, as the legacy form sent it.
 */
export function emptyStockLocation(): StockLocationFormValues {
  return formDefaults(stockLocationFormSchema, {identifier: ''})
}

/** The fetched record as form values. */
export function stockLocationFromRecord(record: Api.InventoryStockLocation.Record): StockLocationFormValues {
  return {...emptyStockLocation(), ...fieldsFromRecord(stockLocationFormSchema, record)}
}

export const FIELD_LABELS = {
  name: () => $trans('Name'),
  identifier: () => $trans('Identifier'),
} as const satisfies FieldLabels<keyof StockLocationFormValues>

/**
 * Every write validates against the strengthened create body. The patch body
 * an edit sends is a superset of that.
 */
export const stockLocationWrite = writeContract(Api.InventoryStockLocation, {
  validateWith: stockLocationFormSchema,
  labels: FIELD_LABELS,
})

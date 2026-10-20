import * as v from 'valibot'

import {
  fieldErrors,
  toApiDate,
  type FieldErrors,
  type FieldLabels,
  type FieldMessages,
} from '@/features/forms'
import { formDefaults } from '@/models/schema'

const entryRequest = Api.InventoryPurchaseorderEntry.create.body

/**
 * One entry as the form holds it: the row being composed or edited, and each
 * staged row of a create. The wire fields are the request's; the rest is
 * display the table and the read-only inputs show and the parse drops again.
 */
export type EntryValues = Omit<
  Required<v.InferInput<typeof entryRequest>>,
  'purchase_order_material' | 'amount' | 'entry_date'
> & {
  /** The picker is empty rather than absent until a product is chosen. */
  purchase_order_material: number | null
  /** Text, because it is typed; the parse sends a Number. */
  amount: string
  /** The date picker hands over a Date; the parse sends `YYYY-MM-DD`. */
  entry_date: Date | null
  /** The product's name and unit, for the table and the read-only inputs. */
  material_name: string
  unit: string
  /** What the purchase order asked for; null on a row the user typed from scratch. */
  ordered_amount: number | null
  /** The location's name, for the table. */
  stock_location_name: string
}

/**
 * A staged row of a create: an entry the row check let through, so it has its
 * product and its date. The editor composing one holds `EntryValues`.
 */
export type EntryRow = Omit<EntryValues, 'purchase_order_material' | 'entry_date'> & {
  purchase_order_material: number
  entry_date: Date
}

export type EntryFieldErrors = FieldErrors<keyof EntryValues>

/** A blank entry, dated today: no product, no amount and no location yet. */
export function emptyEntry(): EntryValues {
  return {
    // An unchosen product is null, not the 0 a required integer blanks to.
    ...formDefaults(entryRequest, {purchase_order_material: null}),
    amount: '0',
    entry_date: new Date(),
    material_name: '',
    unit: '',
    ordered_amount: null,
    stock_location_name: '',
  }
}

/**
 * A stored day (`YYYY-MM-DD`, the ISO twin of the tenant-formatted
 * `entry_date`) as the local Date the picker holds.
 */
function dayOf(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** The stored entry as form values. */
export function entryFromRecord(record: Api.InventoryPurchaseorderEntry.Record): EntryValues {
  return {
    purchase_order: record.purchase_order ?? null,
    purchase_order_material: record.purchase_order_material,
    material_name: record.material_name,
    unit: '',
    ordered_amount: null,
    amount: String(record.amount ?? 0),
    entry_date: dayOf(record.entry_date_iso),
    stock_location: record.stock_location ?? null,
    stock_location_name: record.stock_location_name,
  }
}

/** One staged entry per ordered material: the whole ordered amount, dated today. */
export function entryForMaterial(material: Api.PurchaseOrderMaterial, purchaseOrder: number): EntryRow {
  return {
    ...emptyEntry(),
    purchase_order: purchaseOrder,
    purchase_order_material: material.id,
    entry_date: new Date(),
    material_name: material.material_view.name ?? '',
    unit: material.material_view.unit ?? '',
    ordered_amount: material.amount ?? 0,
    amount: String(material.amount ?? 0),
  }
}

/**
 * What a row must be before it is added or saved: the request's own entries,
 * with the three rules the form adds on top. A product is chosen, a date is
 * entered, and the amount is at least 1 - the request allows 0, the legacy
 * form never did (see the ledger).
 */
const vEntryRow = v.object({
  ...entryRequest.entries,
  amount: v.pipe(v.unwrap(entryRequest.entries.amount), v.minValue(1)),
  entry_date: v.unwrap(entryRequest.entries.entry_date),
})

export const FIELD_LABELS = {
  purchase_order: () => $trans('Purchase order'),
  purchase_order_material: () => $trans('Product'),
  amount: () => $trans('Entry'),
  entry_date: () => $trans('Date'),
  stock_location: () => $trans('Move to location'),
} as const satisfies FieldLabels<keyof EntryValues>

// The legacy copy, kept where it says what the user has to do more precisely
// than the rule line would: a zero amount reads "enter an amount", not "at
// least 1", and the date is entered, not selected. An unpicked product needs
// none: the rule line already reads "Please select a product".
export const FIELD_MESSAGES = {
  amount: () => $trans('Please enter an amount'),
  entry_date: () => $trans('Please enter a date'),
} as const satisfies FieldMessages<keyof EntryValues>

/** The wire-shaped entry: a Number, and the day as `YYYY-MM-DD`, on a copy. */
function shaped(values: EntryValues) {
  return {
    purchase_order: values.purchase_order,
    purchase_order_material: values.purchase_order_material,
    amount: Number(values.amount),
    entry_date: values.entry_date ? toApiDate(values.entry_date) : null,
    stock_location: values.stock_location,
  }
}

export function entryErrors(values: EntryValues): EntryFieldErrors {
  return fieldErrors(vEntryRow, shaped(values), FIELD_MESSAGES, FIELD_LABELS)
}

/**
 * The bulk endpoint's body: a bare list, one object per staged row, in one
 * atomic request. Only the keys the request declares are sent.
 */
export function parseEntryRows(rows: readonly EntryRow[]) {
  return v.parse(Api.InventoryPurchaseorderEntryBulk.create.body, rows.map(shaped))
}

/**
 * The PATCH body of the edit. An explicit null `stock_location` is rejected
 * by the API, so a row without one sends no key at all.
 */
export function parseEntryPatch(values: EntryValues) {
  const { stock_location, ...body } = shaped(values)
  return v.parse(Api.InventoryPurchaseorderEntry.update.body, stock_location === null ? body : { ...body, stock_location })
}

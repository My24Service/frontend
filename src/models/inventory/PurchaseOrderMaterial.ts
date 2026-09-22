import * as v from 'valibot'
import BaseModel from '../base'
import type { PurchaseOrderMaterialRowRequest } from '@/api/types.gen'
import { vPurchaseOrderMaterial } from '@/api/valibot.gen'
import { formDefaults, formSchema, lenient, writeSchema } from '../schema'

/**
 * Generated from `PurchaseOrderMaterialSerializer` via the OpenAPI schema.
 * Regenerate with `npm run codegen`.
 *
 * Four of its fields are `SerializerMethodField`s and therefore read-only:
 * `material_view` (a nested `MaterialSerializer` payload, `vMaterial`),
 * `purchase_order_view` (a hand-built dict, `vPurchaseOrderView`),
 * `num_entries` (a count) and `total_entries`. The generator already types
 * `total_entries` as `number | string` directly from the serializer's
 * `SerializerMethodField` - the hand-written version had to explain in prose
 * that it returns `'-'` when the annotation is absent; that is now just a
 * form default rather than a workaround.
 *
 * The serializer exposes `modified` but not `created`.
 *
 * `purchase_order` is nullable: a PurchaseOrderMaterial can exist before it is
 * attached to an order.
 */
export const PurchaseOrderMaterialSchema = lenient(vPurchaseOrderMaterial)

/**
 * `amount` is a `PositiveIntegerField` server-side, but the form's text input
 * has always started it at 0, so it keeps that default here. `material_name` is
 * nullable and the views expect null rather than ''. The rest of the form's
 * fields infer.
 *
 * `total_entries` is deliberately absent. It is read-only and not one of the
 * form's picked fields, so a default for it would never be read - and
 * `formDefaults` rejects it outright rather than letting it sit here looking
 * meaningful.
 */
const FORM_DEFAULTS = {
  amount: 0,
  material_name: null,
  // A pk and an FK the form has not got yet. Non-nullable integers on the
  // wire, so they would infer 0 - but 0 is a real id, and the form needs to
  // tell a row it has not saved yet from one the server knows.
  id: null,
  material: null,
  remarks: '',
}

export const PurchaseOrderMaterialWriteSchema = writeSchema(vPurchaseOrderMaterial, [
  'id',
  'material_view',
  'purchase_order_view',
  'modified',
  'num_entries',
  'total_entries',
])

/**
 * `id` and `material_view` are kept in the form defaults because the form edits
 * this row as part of the order: `material_view` is what the table and the
 * product picker read for display, and `id` is what tells a stored row from one
 * that has not been saved yet.
 */
export const PurchaseOrderMaterialFormSchema = formSchema(PurchaseOrderMaterialSchema, [
  'id',
  'purchase_order',
  'material_view',
  'material',
  'material_name',
  'amount',
  'remarks',
])

export type PurchaseOrderMaterial = v.InferOutput<typeof PurchaseOrderMaterialSchema>
export type PurchaseOrderMaterialWrite = v.InferOutput<typeof PurchaseOrderMaterialWriteSchema>

/**
 * One `materials` row of a PurchaseOrder `with-materials` request body.
 *
 * Those endpoints read the list as the order's whole child set: a row without
 * an `id` is created, a row with one updates that stored row, and a stored row
 * the list leaves out is deleted. So a row that has never been saved carries no
 * `id` key at all rather than a null one - `id` is nullable on the wire, and
 * what distinguishes create from update is whether the key is there.
 *
 * `amount` is bound to a text input in the forms, so it arrives as a string
 * where the request declares a number.
 */
export function purchaseOrderMaterialRow(row: {
  id?: number | null
  material: number
  amount: number | string
  remarks?: string | null
}): PurchaseOrderMaterialRowRequest {
  return {
    ...(row.id ? { id: row.id } : {}),
    material: row.material,
    amount: Number(row.amount),
    remarks: row.remarks ?? null,
  }
}

class PurchaseOrderMaterialService extends BaseModel {
  fields = formDefaults(PurchaseOrderMaterialFormSchema, FORM_DEFAULTS)

  url = '/inventory/purchaseorder-material/'
}

const purchaseOrderMaterialModel = new PurchaseOrderMaterialService()

export default purchaseOrderMaterialModel
export { PurchaseOrderMaterialService }

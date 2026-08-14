import * as v from 'valibot'
import BaseModel from '../base'
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
 * `amount` is a decimal, so it renders as a string and would infer `''`; the
 * form has always started it at 0. `material_name` is nullable and the views
 * expect null rather than ''. The rest of the form's fields infer.
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
  // wire, so they would infer 0 - but 0 is a real id, and `updateCollection()`
  // branches on `item.id` to tell a new row from an existing one.
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
 * `id` and `material_view` are kept in the form defaults because this model is
 * edited as part of a `BaseModel` collection, where `updateCollection()`
 * branches on `item.id` and the views read `material_view` for display.
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

class PurchaseOrderMaterialService extends BaseModel {
  fields = formDefaults(PurchaseOrderMaterialFormSchema, FORM_DEFAULTS)

  url = '/inventory/purchaseorder-material/'
}

const purchaseOrderMaterialModel = new PurchaseOrderMaterialService()

export default purchaseOrderMaterialModel
export { PurchaseOrderMaterialService }

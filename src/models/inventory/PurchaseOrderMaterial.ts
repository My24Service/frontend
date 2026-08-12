import * as v from 'valibot'
import BaseModel from '../base'
import { fk, formFields, formSchema, int, nullableStr, timestamp, view, writeSchema } from '../schema'

/**
 * Mirrors `PurchaseOrderMaterialSerializer` (apps/inventory/serializers.py).
 *
 * Four of its fields are `SerializerMethodField`s and therefore read-only:
 * `material_view` (a nested `MaterialSerializer` payload),
 * `purchase_order_view` (a hand-built dict), `num_entries` (a count) and
 * `total_entries`, which returns `'-'` when the annotation is absent - hence
 * the string|number union.
 *
 * The serializer exposes `modified` but not `created`.
 *
 * `purchase_order` is nullable: a PurchaseOrderMaterial can exist before it is
 * attached to an order.
 */
export const PurchaseOrderMaterialSchema = v.object({
  id: fk(),
  material: fk(),
  material_name: nullableStr(),
  material_view: view(),
  purchase_order: fk(),
  purchase_order_view: view(),
  amount: int(),
  remarks: nullableStr(''),
  modified: timestamp(),
  num_entries: int(),
  total_entries: v.optional(v.union([v.string(), v.number()]), '-'),
})

export const PurchaseOrderMaterialWriteSchema = writeSchema(PurchaseOrderMaterialSchema, [
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
  fields = formFields(PurchaseOrderMaterialFormSchema)

  url = '/inventory/purchaseorder-material/'
}

const purchaseOrderMaterialModel = new PurchaseOrderMaterialService()

export default purchaseOrderMaterialModel
export { PurchaseOrderMaterialService }

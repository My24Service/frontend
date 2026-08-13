import * as v from 'valibot'
import BaseModel from '../base'
import { vPurchaseOrderMaterial } from '@/api/valibot.gen'
import { formFields, formSchema, withDefaults, writeSchema } from '../schema'

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
 * attached to an order. `material_view` and `purchase_order_view` are
 * required by the generated schema (read-only fields are always present on
 * read), so they get object defaults here to keep parsing partial payloads
 * permissive.
 */
export const PurchaseOrderMaterialSchema = withDefaults(vPurchaseOrderMaterial, {
  id: null,
  material: null,
  material_name: null,
  material_view: {},
  purchase_order: null,
  purchase_order_view: {},
  amount: 0,
  remarks: '',
  modified: null,
  num_entries: 0,
  total_entries: '-',
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

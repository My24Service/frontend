import * as v from 'valibot'
import BaseModel from '../base'
import { fk, formFields, formSchema, str, timestamp, writeSchema } from '../schema'

/**
 * Mirrors `PurchaseOrderStatusSerializer` (apps/inventory/serializers.py),
 * whose model `PurchaseOrderStatus` extends `AbstractStatus` - hence the
 * non-null `status` CharField alongside the `purchase_order` FK.
 *
 * Note the serializer exposes `created` but not `modified`.
 */
export const PurchaseOrderStatusSchema = v.object({
  id: fk(),
  purchase_order: fk(0),
  status: str(),
  created: timestamp(),
})

export const PurchaseOrderStatusWriteSchema = writeSchema(PurchaseOrderStatusSchema, [
  'id',
  'created',
])

/**
 * `new_status` is client-only: it is the bound value of the status dropdown in
 * PurchaseOrderList.vue, which posts it as `status`. It has never been part of
 * the serializer, so it is declared here as UI state rather than being added to
 * the read schema and making that schema wrong.
 */
export const PurchaseOrderStatusFormSchema = formSchema(
  PurchaseOrderStatusSchema,
  ['purchase_order', 'status'],
  { new_status: str() },
)

export type PurchaseOrderStatus = v.InferOutput<typeof PurchaseOrderStatusSchema>
export type PurchaseOrderStatusWrite = v.InferOutput<typeof PurchaseOrderStatusWriteSchema>

class PurchaseOrderStatusService extends BaseModel {
  fields = formFields(PurchaseOrderStatusFormSchema)

  url = '/inventory/purchaseorder-status/'
}

const purchaseOrderStatusModel = new PurchaseOrderStatusService()

export default purchaseOrderStatusModel
export { PurchaseOrderStatusService }

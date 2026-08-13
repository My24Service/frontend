import * as v from 'valibot'
import BaseModel from '../base'
import { vPurchaseOrderStatus } from '@/api/valibot.gen'
import { formFields, formSchema, str, withDefaults, writeSchema } from '../schema'

/**
 * Generated from `PurchaseOrderStatusSerializer` via the OpenAPI schema,
 * whose model `PurchaseOrderStatus` extends `AbstractStatus` - hence the
 * non-null `status` CharField alongside the `purchase_order` FK. Regenerate
 * with `npm run codegen`.
 *
 * Note the serializer exposes `created` but not `modified`.
 */
export const PurchaseOrderStatusSchema = withDefaults(vPurchaseOrderStatus, {
  id: null,
  purchase_order: 0,
  status: '',
  created: null,
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

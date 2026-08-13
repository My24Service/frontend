import * as v from 'valibot'
import BaseModel from '../base'
import { vSupplierReservationMaterial } from '@/api/valibot.gen'
import { formDefaults, formSchema, lenient, nullableStr, writeSchema } from '../schema'

/**
 * Generated from `SupplierReservationMaterialSerializer` via the OpenAPI
 * schema. Regenerate with `npm run codegen`.
 *
 * `material_view` is a `SerializerMethodField` returning a nested
 * `MaterialSerializer` payload (`vMaterial`).
 */
export const SupplierReservationMaterialSchema = lenient(vSupplierReservationMaterial)

/** `amount` is a decimal, so it renders as a string and would infer `''`. */
const FORM_DEFAULTS = {
  amount: 0,
  // See PurchaseOrderMaterial: a pk/FK the form has not got yet is null, not
  // the 0 the non-nullable integer type would infer.
  id: null,
  material: null,
  reservation: null,
  remarks: '',
}

export const SupplierReservationMaterialWriteSchema = writeSchema(
  vSupplierReservationMaterial,
  ['id', 'material_view', 'created', 'modified'],
)

/**
 * `material_name` is client-only here. The Django model does have that column,
 * but `SupplierReservationMaterialSerializer` does not expose it, so it never
 * arrives from - or is accepted by - the API. It stays in the form defaults to
 * preserve existing view behaviour, declared as UI state so the read schema
 * keeps matching the serializer.
 */
export const SupplierReservationMaterialFormSchema = formSchema(
  SupplierReservationMaterialSchema,
  ['id', 'reservation', 'material_view', 'material', 'amount', 'remarks'],
  { material_name: nullableStr() },
)

export type SupplierReservationMaterial = v.InferOutput<typeof SupplierReservationMaterialSchema>
export type SupplierReservationMaterialWrite = v.InferOutput<
  typeof SupplierReservationMaterialWriteSchema
>

class SupplierReservationMaterialService extends BaseModel {
  fields = formDefaults(SupplierReservationMaterialFormSchema, FORM_DEFAULTS)

  url = '/inventory/supplier-reservationmaterial/'
}

const supplierReservationMaterialModel = new SupplierReservationMaterialService()

export default supplierReservationMaterialModel
export { SupplierReservationMaterialService }

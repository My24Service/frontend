import * as v from 'valibot'
import BaseModel from '../base'
import { vSupplierReservationMaterial } from '@/api/valibot.gen'
import { formFields, formSchema, nullableStr, withDefaults, writeSchema } from '../schema'

/**
 * Generated from `SupplierReservationMaterialSerializer` via the OpenAPI
 * schema. Regenerate with `npm run codegen`.
 *
 * `material_view` is a `SerializerMethodField` returning a nested
 * `MaterialSerializer` payload (`vMaterial`), so it is required on read but
 * gets an object default here so partial payloads still parse.
 */
export const SupplierReservationMaterialSchema = withDefaults(vSupplierReservationMaterial, {
  id: null,
  reservation: null,
  material: null,
  amount: 0,
  material_view: {},
  remarks: '',
  created: null,
  modified: null,
})

export const SupplierReservationMaterialWriteSchema = writeSchema(
  SupplierReservationMaterialSchema,
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
  fields = formFields(SupplierReservationMaterialFormSchema)

  url = '/inventory/supplier-reservationmaterial/'
}

const supplierReservationMaterialModel = new SupplierReservationMaterialService()

export default supplierReservationMaterialModel
export { SupplierReservationMaterialService }

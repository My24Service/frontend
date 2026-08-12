import * as v from 'valibot'
import BaseModel from '../base'
import { fk, formFields, formSchema, int, nullableStr, timestamp, view, writeSchema } from '../schema'

/**
 * Mirrors `SupplierReservationMaterialSerializer` (apps/inventory/serializers.py).
 *
 * `material_view` is a `SerializerMethodField` returning a nested
 * `MaterialSerializer` payload, so it is read-only.
 */
export const SupplierReservationMaterialSchema = v.object({
  id: fk(),
  reservation: fk(),
  material: fk(),
  amount: int(),
  material_view: view(),
  remarks: nullableStr(''),
  created: timestamp(),
  modified: timestamp(),
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

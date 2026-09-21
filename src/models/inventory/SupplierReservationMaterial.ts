import * as v from 'valibot'
import BaseModel from '../base'
import type { SupplierReservationMaterialRowRequest } from '@/api/types.gen'
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

/**
 * `amount` is a `PositiveIntegerField` server-side; the form's text input has
 * always started it at 0, so it keeps that default here.
 */
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

/**
 * One `materials` row of a SupplierReservation `with-materials` request body.
 *
 * Those endpoints read the list as the reservation's whole child set: a row
 * without an `id` is created, a row with one updates that stored row, and a
 * stored row the list leaves out is deleted. So a row that has never been saved
 * carries no `id` key at all rather than a null one - `id` is nullable on the
 * wire, and what distinguishes create from update is whether the key is there.
 * The `reservation` FK is left out for the same reason the parent supplies it.
 *
 * `amount` is bound to a text input in the forms, so it arrives as a string
 * where the request declares a number.
 */
export function supplierReservationMaterialRow(row: {
  id?: number | null
  material: number
  amount: number | string
  remarks?: string | null
}): SupplierReservationMaterialRowRequest {
  return {
    ...(row.id ? { id: row.id } : {}),
    material: row.material,
    amount: Number(row.amount),
    remarks: row.remarks ?? null,
  }
}

class SupplierReservationMaterialService extends BaseModel {
  fields = formDefaults(SupplierReservationMaterialFormSchema, FORM_DEFAULTS)

  url = '/inventory/supplier-reservationmaterial/'
}

const supplierReservationMaterialModel = new SupplierReservationMaterialService()

export default supplierReservationMaterialModel
export { SupplierReservationMaterialService }

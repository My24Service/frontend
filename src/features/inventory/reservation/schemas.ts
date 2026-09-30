import * as v from 'valibot'

import {
  fieldErrors,
  type FieldErrors,
  type FieldLabels,
  type WriteContext,
} from '@/features/forms'

/** The reservation's own state: the supplier it holds products at, null until one is picked. */
export interface ReservationFormValues {
  supplier: number | null
}

export type ReservationFieldErrors = FieldErrors<keyof ReservationFormValues>

export function emptyReservation(): ReservationFormValues {
  return {supplier: null}
}

export function reservationFromRecord(record: Api.SupplierReservation): ReservationFormValues {
  return {supplier: record.supplier}
}

// A picker left empty is a null, which the rule's own line reads as "select":
// the label is all this adds.
const FIELD_LABELS = {
  supplier: () => $trans('Supplier'),
} as const satisfies FieldLabels<keyof ReservationFormValues>

const CreateBody = Api.InventorySupplierReservationWithMaterials.create.body
const UpdateBody = Api.InventorySupplierReservation.extras.withMaterialsPartialUpdate.body

/** One product row of the reservation's with-materials body: the material rows panel checks its draft against it. */
export const materialRowSchema = v.unwrap(CreateBody.entries.materials).item

/**
 * Both directions validate the create body: the form saves a whole
 * reservation, and that is the component whose supplier is required.
 */
export function validateReservation(values: ReservationFormValues): ReservationFieldErrors {
  return fieldErrors(CreateBody, {...values, materials: []}, {}, FIELD_LABELS)
}

export type ReservationWithMaterialsBody = v.InferOutput<typeof CreateBody> | v.InferOutput<typeof UpdateBody>

/**
 * The body of a save: the supplier and the reservation's whole product set.
 * `POST supplier-reservation/with-materials/` and `PATCH
 * supplier-reservation/{id}/with-materials/` take one body between them, and
 * read the list as the reservation's complete child set: a row without an
 * `id` is created, one with it updated, a stored row left out deleted.
 */
export function parseReservation(
  values: ReservationFormValues,
  materials: v.InferOutput<typeof materialRowSchema>[],
  context: Pick<WriteContext, 'isCreate'>,
): ReservationWithMaterialsBody {
  return v.parse(context.isCreate ? CreateBody : UpdateBody, {supplier: values.supplier, materials})
}

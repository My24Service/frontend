import type {
  FieldErrors,
  FieldLabels,
} from '@/features/forms'

import { ownedRecordSchemas } from '@/features/equipment/owner'

/**
 * The form's own state.
 *
 * The create body is a union - `{branch, name, building}` or
 * `{customer, name, building}` - but the form holds both owner slots, because
 * which one applies is a property of the tenant rather than of the field. The
 * parse below resolves the union and drops the slot that does not apply.
 */
export interface LocationFormValues {
  name: string
  customer: number | null
  branch: number | null
  /**
   * Absent until a building is picked, rather than null: a create that never
   * touched the select then carries no `building` key at all, which is what the
   * legacy screen sent (its model's fields had no initializers, so JSON dropped
   * them). A record read back from the API does hold null there, and round-trips
   * it - see `locationFromRecord`.
   */
  building?: number | null
}

export type LocationFieldErrors = FieldErrors<keyof LocationFormValues>

/** A location as the form is filled in from scratch. */
export function emptyLocation(): LocationFormValues {
  return {name: '', customer: null, branch: null}
}

/** The fetched record as form values: the four fields this form owns. */
export function locationFromRecord(record: Api.Location): LocationFormValues {
  return {
    name: record.name,
    customer: record.customer ?? null,
    branch: record.branch ?? null,
    building: record.building ?? null,
  }
}

export const FIELD_LABELS = {
  name: () => $trans('Name'),
} as const satisfies FieldLabels<keyof LocationFormValues>

/**
 * Validation and the wire body, shared with the other owned records: the
 * generated entries under the copy above, the owner rule, and the parse
 * against this tenant's create variant or the patch body - see
 * `ownedRecordSchemas`.
 */
export const {validate: validateLocation, parse: parseLocation} = ownedRecordSchemas<LocationFormValues>({
  branch: schemas.vLocationBranchCreateRequest,
  customer: schemas.vLocationCustomerCreateRequest,
  patch: schemas.vPatchedLocationRequest,
  labels: FIELD_LABELS,
})

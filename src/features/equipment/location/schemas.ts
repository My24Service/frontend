import { $trans } from '@/services/i18n'
import { requiredOrMaxLength, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import {
  vLocationBranchCreateRequest,
  vLocationCustomerCreateRequest,
  vPatchedLocationRequest,
} from '@/api/valibot.gen'
import type { Location } from '@/api/types.gen'
import { ownedRecordSchemas } from '../owner/owned-record-schemas'

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

export type LocationFieldErrors = FieldErrors<keyof LocationFormValues & string>

/** A location as the form is filled in from scratch. */
export function emptyLocation(): LocationFormValues {
  return {name: '', customer: null, branch: null}
}

/** The fetched record as form values: the four fields this form owns. */
export function locationFromRecord(record: Location): LocationFormValues {
  return {
    name: record.name,
    customer: record.customer ?? null,
    branch: record.branch ?? null,
    building: record.building ?? null,
  }
}

// The generated `name` entry already carries minLength(1) and maxLength(255);
// nothing here redeclares it. The copy is all this file adds, and it is a leaf
// function rather than a nested object: `fieldErrors` walks the message tree by
// the issue's own path, so a shape keyed by rule name would only ever match a
// field literally called `min_length`.
const MESSAGES = {
  name_required: () => $trans('Please enter a name'),
  name_max_length: () => $trans('Please use at most 255 characters'),
} as const

export const FIELD_MESSAGES = {
  name: requiredOrMaxLength(MESSAGES.name_required, MESSAGES.name_max_length),
} satisfies FieldMessages<keyof LocationFormValues & string>

/**
 * Validation and the wire body, shared with the other owned records: the
 * generated entries under the copy above, the owner rule, and the parse
 * against this tenant's create variant or the patch body - see
 * `ownedRecordSchemas`.
 */
export const {validate: validateLocation, parse: parseLocation} = ownedRecordSchemas<LocationFormValues>({
  branch: vLocationBranchCreateRequest,
  customer: vLocationCustomerCreateRequest,
  patch: vPatchedLocationRequest,
  messages: FIELD_MESSAGES,
})

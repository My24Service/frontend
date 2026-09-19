import { $trans } from '@/services/i18n'
import { requiredOrMaxLength, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import {
  vBuildingBranchCreateRequest,
  vBuildingCustomerCreateRequest,
  vPatchedBuildingRequest,
} from '@/api/valibot.gen'
import type { Building } from '@/api/types.gen'
import { ownedRecordSchemas } from '../owner/owned-record-schemas'

/**
 * The form's own state.
 *
 * The create body is a union - `{branch, name}` or `{customer, name}` - but the
 * form holds both slots, because which one applies is a property of the member
 * rather than of the field. The parse below resolves the union and drops the
 * slot that does not apply.
 */
export interface BuildingFormValues {
  name: string
  customer: number | null
  branch: number | null
}

export type BuildingFieldErrors = FieldErrors<keyof BuildingFormValues & string>

/** A building as the form is filled in from scratch. */
export function emptyBuilding(): BuildingFormValues {
  return {name: '', customer: null, branch: null}
}

/** The fetched record as form values: the three fields this form owns. */
export function buildingFromRecord(record: Building): BuildingFormValues {
  return {
    name: record.name,
    customer: record.customer ?? null,
    branch: record.branch ?? null,
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
} satisfies FieldMessages<keyof BuildingFormValues & string>

/**
 * Validation and the wire body, shared with the other owned records: the
 * generated entries under the copy above, the owner rule, and the parse
 * against this tenant's create variant or the patch body - see
 * `ownedRecordSchemas`.
 */
export const {validate: validateBuilding, parse: parseBuilding} = ownedRecordSchemas<BuildingFormValues>({
  branch: vBuildingBranchCreateRequest,
  customer: vBuildingCustomerCreateRequest,
  patch: vPatchedBuildingRequest,
  messages: FIELD_MESSAGES,
})

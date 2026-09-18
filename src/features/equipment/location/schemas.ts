import * as v from 'valibot'
import { $trans } from '@/services/i18n'
import {
  fieldErrors,
  requiredOrMaxLength,
  type FieldErrors,
  type FieldMessages,
} from '@/features/forms/validation'
import type { WriteContext } from '@/features/forms/use-resource-form'
import {
  vLocationBranchCreateRequest,
  vLocationCustomerCreateRequest,
  vPatchedLocationRequest,
} from '@/api/valibot.gen'
import type { Location } from '@/api/types.gen'
import type { OwnerKind } from '../owner/owner-kind'

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
 * A location needs a name, and - when the user is the one choosing - an owner.
 *
 * The name comes from the generated entry. The owner rule is said here rather
 * than by the schema, for the same two reasons the building form gives: valibot
 * reports a failed `oneOf` at the root rather than on either foreign key, so the
 * schema alone would give no field to show the message on; and whether an owner
 * is required at all depends on the role - a branch employee and a customer user
 * send no choice, and the API pins theirs.
 *
 * Slice-ledger case 2 (docs/schema-strengthenings.md, "which owner is
 * required") - the API must stay lax about it, because which key is required is
 * a property of the tenant rather than of the payload.
 */
export function validateLocation(
  values: LocationFormValues,
  context: WriteContext,
  owner: {kind: OwnerKind, responsible: boolean},
): LocationFieldErrors {
  const createSchema = owner.kind === 'branch'
    ? vLocationBranchCreateRequest
    : vLocationCustomerCreateRequest
  const schema = context.isCreate ? createSchema : vPatchedLocationRequest

  const errors = fieldErrors<keyof LocationFormValues & string>(schema, values, FIELD_MESSAGES)

  if (context.isCreate && owner.responsible && values[owner.kind] == null) {
    errors[owner.kind] = owner.kind === 'branch'
      ? $trans('Please select a branch')
      : $trans('Please select a customer')
  }

  return errors
}

/**
 * The body to send, as the generated request component resolves it.
 *
 * The create is parsed against the variant this tenant uses rather than the
 * union, so the parse both checks it and returns it stripped to the keys that
 * variant declares: a branch-owned create goes out as `{branch, name}`, and the
 * `customer: null` the form was holding never reaches the wire. An edit parses
 * the patch body, which declares both owner keys - the form round-trips the
 * record rather than diffing it, as the legacy screen did.
 */
export function parseLocation(
  values: LocationFormValues,
  context: WriteContext,
  kind: OwnerKind,
) {
  if (!context.isCreate) return v.parse(vPatchedLocationRequest, values)
  return v.parse(kind === 'branch'
    ? vLocationBranchCreateRequest
    : vLocationCustomerCreateRequest, values)
}

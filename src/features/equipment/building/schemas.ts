import * as v from 'valibot'
import { $trans } from '@/services/i18n'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import type { WriteContext } from '@/features/forms/use-resource-form'
import {
  vBuildingBranchCreateRequest,
  vBuildingCreateRequestRequest,
  vBuildingCustomerCreateRequest,
  vPatchedBuildingRequest,
} from '@/api/valibot.gen'
import type { Building } from '@/api/types.gen'
import type { OwnerKind } from '../owner/owner-kind'

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
  name: (issue?: v.BaseIssue<unknown>) => (issue?.type === 'max_length'
    ? MESSAGES.name_max_length()
    : MESSAGES.name_required()),
} satisfies FieldMessages<keyof BuildingFormValues & string>

/**
 * A building needs a name, and - when the user is the one choosing - an owner.
 *
 * The name comes from the generated entry. The owner rule is said here rather
 * than by the schema, for two reasons. valibot reports a failed `oneOf` at the
 * root rather than on either foreign key, so the schema alone would give no
 * field to show the message on; and whether an owner is required at all depends
 * on the role - a branch employee and a customer user send no choice, and the
 * API pins theirs.
 *
 * Slice-ledger case 2 (docs/schema-strengthenings.md, "which owner is
 * required") - a rule the API must stay lax about, because which key is
 * required is a property of the tenant rather than of the payload.
 */
export function validateBuilding(
  values: BuildingFormValues,
  context: WriteContext,
  owner: {kind: OwnerKind, responsible: boolean},
): BuildingFieldErrors {
  const createSchema = owner.kind === 'branch'
    ? vBuildingBranchCreateRequest
    : vBuildingCustomerCreateRequest
  const schema = context.isCreate ? createSchema : vPatchedBuildingRequest

  const errors = fieldErrors<keyof BuildingFormValues & string>(schema, values, FIELD_MESSAGES)

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
 * `customer: null` the form was holding never reaches the wire.
 */
export function parseBuilding(
  values: BuildingFormValues,
  context: WriteContext,
  kind: OwnerKind,
) {
  if (!context.isCreate) return v.parse(vPatchedBuildingRequest, values)
  return v.parse(kind === 'branch'
    ? vBuildingBranchCreateRequest
    : vBuildingCustomerCreateRequest, values)
}

/** The two variants as one name, for the form's body type. */
export type BuildingRequestBody = v.InferOutput<typeof vBuildingCreateRequestRequest>

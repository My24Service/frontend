import * as v from 'valibot'
import { format, parseISO } from 'date-fns'
import { EQUIPMENT_TYPES } from '@/constants'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import type { WriteContext } from '@/features/forms/use-resource-form'
import { $trans } from '@/services/i18n'
import {
  vEquipmentBranchCreateRequest,
  vEquipmentCreateRequestRequest,
  vEquipmentCustomerCreateRequest,
  vPatchedEquipmentRequest,
} from '@/api/valibot.gen'
import type { Equipment } from '@/api/types.gen'
import type { OwnerKind } from '../owner/owner-kind'

type EquipmentCreateValues = v.InferInput<typeof vEquipmentBranchCreateRequest>

/**
 * What the equipment form binds to.
 *
 * The create body is a union - `{branch, …}` or `{customer, …}` - but the form
 * holds both owner slots, because which one applies is a property of the tenant
 * rather than of the field; the parse below resolves the union and drops the
 * slot that does not apply. `branch` is nullable here where the request
 * component requires it: on a create nothing is picked yet.
 *
 * `price_currency` is the read-only companion `PriceInput` needs to render the
 * amount. The request direction does not declare it, so the parse drops it again.
 */
export type EquipmentFormValues =
  Omit<EquipmentCreateValues, 'branch'> & {
    branch: number | null
    customer: number | null
    price_currency: string
  }

export type EquipmentFieldErrors = FieldErrors<keyof EquipmentFormValues & string>

/** An equipment as the form is filled in from scratch. */
export function emptyEquipment(currency: string): EquipmentFormValues {
  return {
    name: '',
    type: EQUIPMENT_TYPES.TECHNICAL,
    branch: null,
    customer: null,
    location: null,
    brand: null,
    identifier: null,
    description: null,
    serialnumber: null,
    standard_hours: null,
    installation_date: null,
    production_date: null,
    price: '0.00',
    price_currency: currency,
  }
}

/**
 * The fetched record as form values.
 *
 * `default_replace_months` stays absent rather than null when the record has
 * none: the generated entry is `v.optional(v.number())`, which refuses a null.
 */
export function equipmentFromRecord(record: Equipment): EquipmentFormValues {
  return {
    name: record.name,
    type: record.type,
    branch: record.branch ?? null,
    customer: record.customer ?? null,
    location: record.location ?? null,
    brand: record.brand ?? null,
    identifier: record.identifier ?? null,
    description: record.description ?? null,
    serialnumber: record.serialnumber ?? null,
    standard_hours: record.standard_hours ?? null,
    installation_date: record.installation_date ?? null,
    production_date: record.production_date ?? null,
    default_replace_months: record.default_replace_months,
    price: record.price ?? '0.00',
    price_currency: record.price_currency,
  }
}

/** The record's `YYYY-MM-DD` as the datepicker's model, or nothing. */
export function pickerDate(iso: string | null | undefined): Date | null {
  return iso ? parseISO(iso) : null
}

/**
 * The wire's value for a picked date.
 *
 * Formatted from the Date's local getters rather than `toISOString()`, which
 * reports the previous day for any evening pick east of UTC. Anything that is
 * not a Date - the picker's own null when the field is cleared - clears the
 * field, which the generated `isoDate` entry then accepts as nullish.
 */
export function wireDate(value: Date | null | undefined): string | null {
  return value ? format(value, 'yyyy-MM-dd') : null
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
} satisfies FieldMessages<keyof EquipmentFormValues & string>

/**
 * An equipment needs a name, and - when the user is the one choosing - an owner.
 *
 * The name comes from the generated entry. The owner rule is said here rather
 * than by the schema, for the same two reasons the building form gives: valibot
 * reports a failed `oneOf` at the root rather than on either foreign key, so
 * the schema alone would give no field to show the message on; and whether an
 * owner is required at all depends on the role - a branch employee and a
 * customer user send no choice, and the API pins theirs.
 *
 * Slice-ledger case 2 (docs/schema-strengthenings.md, "which owner is
 * required"): which key is required is a product rule the API has no opinion
 * about, and cannot have - it is a property of the tenant.
 */
export function validateEquipment(
  values: EquipmentFormValues,
  context: WriteContext,
  owner: {kind: OwnerKind, responsible: boolean},
): EquipmentFieldErrors {
  const createSchema = owner.kind === 'branch'
    ? vEquipmentBranchCreateRequest
    : vEquipmentCustomerCreateRequest
  const schema = context.isCreate ? createSchema : vPatchedEquipmentRequest

  const errors = fieldErrors<keyof EquipmentFormValues & string>(schema, values, FIELD_MESSAGES)

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
 * variant declares: a branch-owned create goes out without the `customer` slot
 * the form was holding, and the read-only `price_currency` never reaches the
 * wire at all.
 */
export function parseEquipment(
  values: EquipmentFormValues,
  context: WriteContext,
  kind: OwnerKind,
) {
  if (!context.isCreate) return v.parse(vPatchedEquipmentRequest, values)
  return v.parse(kind === 'branch'
    ? vEquipmentBranchCreateRequest
    : vEquipmentCustomerCreateRequest, values)
}

/** The two variants as one name, for the form's body type. */
export type EquipmentRequestBody = v.InferOutput<typeof vEquipmentCreateRequestRequest>

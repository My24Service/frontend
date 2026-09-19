import * as v from 'valibot'

import { vBranchRequest, vPatchedBranchRequest } from '@/api/valibot.gen'
import type { Branch } from '@/api/types.gen'
import {
  fieldErrors,
  requiredOrMaxLength,
  type FieldErrors,
  type FieldMessages,
} from '@/features/forms/validation'
import type { WriteContext } from '@/features/forms/use-resource-form'
import { $trans } from '@/services/i18n'

/**
 * The form's own state. The generated request carries the image as an
 * optional base64 string; the form holds the staged upload as `string | null`
 * - null while no file was picked - so "no new file" is a state rather than
 * an absent key the parse has to guess at. The record's own image (a URL the
 * write endpoint rejects) never enters the values.
 */
export interface BranchFormValues {
  name: string
  address: string
  postal: string
  city: string
  country_code: string
  tel: string | null
  email: string | null
  contact: string | null
  mobile: string | null
  /** A newly picked file as a data URL, or null when no file was chosen. */
  image: string | null
}

export type BranchFieldErrors = FieldErrors<keyof BranchFormValues & string>

/** A branch as the form is filled in from scratch. */
export function emptyBranch(): BranchFormValues {
  return {
    name: '',
    address: '',
    postal: '',
    city: '',
    country_code: 'NL',
    tel: null,
    email: null,
    contact: null,
    mobile: null,
    image: null,
  }
}

/** The fetched record as form values: the ten fields this form owns. */
export function branchFromRecord(record: Branch): BranchFormValues {
  return {
    name: record.name,
    address: record.address,
    postal: record.postal,
    city: record.city,
    country_code: record.country_code ?? '',
    tel: record.tel ?? null,
    email: record.email ?? null,
    contact: record.contact ?? null,
    mobile: record.mobile ?? null,
    image: null,
  }
}

// The generated entries already carry minLength(1) and their maxima; nothing
// here redeclares them. The copy is all this file adds, and each message is a
// leaf function rather than a nested object: `fieldErrors` walks the message
// tree by the issue's own path, so a shape keyed by rule name would only ever
// match a field literally called `min_length`.
const MESSAGES = {
  name_required: () => $trans('Please enter a name'),
  name_max_length: () => $trans('Please use at most 255 characters'),
  address_required: () => $trans('Please enter an address'),
  address_max_length: () => $trans('Please use at most 255 characters'),
  postal_required: () => $trans('Please enter a postal'),
  postal_max_length: () => $trans('Please use at most 20 characters'),
  city_required: () => $trans('Please enter a city'),
  city_max_length: () => $trans('Please use at most 255 characters'),
} as const

export const FIELD_MESSAGES = {
  name: requiredOrMaxLength(MESSAGES.name_required, MESSAGES.name_max_length),
  address: requiredOrMaxLength(MESSAGES.address_required, MESSAGES.address_max_length),
  postal: requiredOrMaxLength(MESSAGES.postal_required, MESSAGES.postal_max_length),
  city: requiredOrMaxLength(MESSAGES.city_required, MESSAGES.city_max_length),
} satisfies FieldMessages<keyof BranchFormValues & string>

/**
 * The wire-shaped body: blank optionals ride as absent keys, not nulls or
 * empty strings. An absent PATCH key leaves the stored value unchanged - the
 * same outcome a null had - and the parse below would reject a null it does
 * not declare on several of these entries.
 */
function shaped(values: BranchFormValues) {
  const body: Record<string, unknown> = {
    name: values.name,
    address: values.address,
    postal: values.postal,
    city: values.city,
  }
  for (const key of ['country_code', 'tel', 'email', 'contact', 'mobile', 'image'] as const) {
    if (values[key]) body[key] = values[key]
  }
  return body
}

/**
 * Every write validates against the create body: the form saves a whole
 * branch, and that is the component that says what a whole branch needs.
 * The patch body it sends is a superset of what PATCH requires, so nothing
 * is added on top of the generated schema.
 */
export function validateBranch(values: BranchFormValues): BranchFieldErrors {
  return fieldErrors(vBranchRequest, shaped(values), FIELD_MESSAGES)
}

/**
 * The body to send, as the generated request component resolves it: the
 * create parses the create body, the edit the patch body, both stripped to
 * the keys they declare.
 */
export function parseBranch(values: BranchFormValues, context: WriteContext) {
  const body = shaped(values)
  if (!context.isCreate) return v.parse(vPatchedBranchRequest, body)
  return v.parse(vBranchRequest, body)
}

import { companyBranch } from '@/api/resources.gen'
import type { Branch } from '@/api/types.gen'
import type { FieldErrors } from '@/features/forms'
import type { FieldLabels } from '@/features/forms'
import { writeContract } from '@/features/forms'
import { formDefaults } from '@/models/schema'
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

/**
 * A branch as the form is filled in from scratch: every field of the request
 * component, blanked by its own type. The two claims the schema cannot make
 * are stated as overrides - the country a new branch starts in, and the
 * staged upload, which is "no file picked" rather than an absent key.
 *
 * The declared return type says the rest: `formDefaults` hands back the
 * request component's input with `Required` lifting the optional modifier, so
 * all ten fields come back filled and `BranchFormValues` checks without an
 * assertion.
 */
export function emptyBranch(): BranchFormValues {
  return formDefaults(companyBranch.create.body, {country_code: 'NL', image: null})
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
// here redeclares them. The labels are all this file adds: every line a
// branch field can show is a rule's line with the label filled in.
export const FIELD_LABELS = {
  name: () => $trans('Name'),
  address: () => $trans('Address'),
  postal: () => $trans('Postal'),
  city: () => $trans('City'),
} satisfies FieldLabels<keyof BranchFormValues & string>

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
 * branch, and that is the component which says what a whole branch needs. The
 * patch body it sends is a superset of what PATCH requires, so nothing is
 * added on top of the generated schema.
 */
export const branchWrite = writeContract(companyBranch, {
  validateWith: companyBranch.create.body,
  shape: shaped,
  labels: FIELD_LABELS,
})

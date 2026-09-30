import * as v from 'valibot'

import {
  fieldsFromRecord,
  type FieldErrors,
  type FieldLabels,
  writeContract,
} from '@/features/forms'
import { formDefaults } from '@/models/schema'

const body = Api.InventorySupplier.create.body

/** The text fields a supplier may leave blank. */
const OPTIONAL_TEXT = ['identifier', 'email', 'tel', 'mobile', 'contact'] as const

/**
 * The ten fields this form owns, picked from the create body: the form saves
 * the whole supplier it owns, and that is the component that says what a whole
 * supplier needs. The record's `remarks` and `external_identifier` are not on
 * this form, so they are not here and an edit leaves them alone.
 *
 * `name`, `address`, `postal` and `city` are piped with a minimum. Case 1
 * (`docs/schema-strengthenings.md` entry 10): the request declares them
 * nullish with no minimum, so a blank one passes the generated schema, and a
 * supplier needs them. `v.unwrap` drops the null and keeps the maximum codegen
 * put underneath.
 */
const supplierFormSchema = v.object({
  ...v.pick(body, ['name', 'address', 'postal', 'city', 'country_code', ...OPTIONAL_TEXT]).entries,
  name: v.pipe(v.unwrap(body.entries.name), v.minLength(1)),
  address: v.pipe(v.unwrap(body.entries.address), v.minLength(1)),
  postal: v.pipe(v.unwrap(body.entries.postal), v.minLength(1)),
  city: v.pipe(v.unwrap(body.entries.city), v.minLength(1)),
})

/** The form's own state: the picked fields, as the schema takes them. */
export type SupplierFormValues = Required<v.InferInput<typeof supplierFormSchema>>

export type SupplierFieldErrors = FieldErrors<keyof SupplierFormValues>

/**
 * A blank supplier, in the country a new supplier starts in. The text inputs
 * start at `''` rather than the null a nullish entry blanks to, as the legacy
 * form sent them.
 */
export function emptySupplier(): SupplierFormValues {
  return formDefaults(supplierFormSchema, {
    ...Object.fromEntries(OPTIONAL_TEXT.map((key) => [key, ''])),
    country_code: 'NL',
  })
}

/**
 * The fetched record as form values. A country the record leaves out keeps the
 * blank's: the create body will not take a blank one.
 */
export function supplierFromRecord(record: Api.InventorySupplier.Record): SupplierFormValues {
  return {...emptySupplier(), ...fieldsFromRecord(supplierFormSchema, record)}
}

// The generated entries carry the maxima; the labels name the field in each of
// those lines and in the required one.
export const FIELD_LABELS = {
  identifier: () => $trans('Identifier'),
  name: () => $trans('Name'),
  address: () => $trans('Address'),
  postal: () => $trans('Postal'),
  city: () => $trans('City'),
  country_code: () => $trans('Country'),
  email: () => $trans('Email'),
  tel: () => $trans('Tel.'),
  mobile: () => $trans('Mobile'),
  contact: () => $trans('Contact'),
} as const satisfies FieldLabels<keyof SupplierFormValues>

/**
 * Every write validates against the strengthened create body. The patch body
 * an edit sends is a superset of that.
 */
export const supplierWrite = writeContract(Api.InventorySupplier, {
  validateWith: supplierFormSchema,
  labels: FIELD_LABELS,
})

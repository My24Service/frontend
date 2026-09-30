import * as v from 'valibot'

import {
  type FieldErrors,
  type FieldLabels,
  writeContract,
} from '@/features/forms'

/**
 * The form's own state: the ten supplier fields this form owns, every one a
 * string the inputs bind to. The record's `remarks` and `external_identifier`
 * are not on this form, so they are not here and an edit leaves them alone.
 */
export type SupplierFormValues = {
  identifier: string
  name: string
  address: string
  postal: string
  city: string
  country_code: string
  email: string
  tel: string
  mobile: string
  contact: string
}

export type SupplierFieldErrors = FieldErrors<keyof SupplierFormValues>

/**
 * A blank supplier: the ten fields of the form, blank, and the country a new
 * supplier starts in. The generated create body has twelve keys; the form owns
 * ten, so the blank is written out rather than derived from the whole.
 */
export function emptySupplier(): SupplierFormValues {
  return {
    identifier: '',
    name: '',
    address: '',
    postal: '',
    city: '',
    country_code: 'NL',
    email: '',
    tel: '',
    mobile: '',
    contact: '',
  }
}

/** The fetched record as form values. */
export function supplierFromRecord(record: Api.InventorySupplier.Record): SupplierFormValues {
  return {
    identifier: record.identifier ?? '',
    name: record.name ?? '',
    address: record.address ?? '',
    postal: record.postal ?? '',
    city: record.city ?? '',
    // Optional on the record; the create body will not take a blank one.
    country_code: record.country_code ?? 'NL',
    email: record.email ?? '',
    tel: record.tel ?? '',
    mobile: record.mobile ?? '',
    contact: record.contact ?? '',
  }
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

const body = Api.InventorySupplier.create.body.entries

/**
 * The create body with the four fields a supplier needs. The request declares
 * `name`, `address`, `postal` and `city` nullish with no minimum, so a blank
 * one passes the generated schema. `v.unwrap` drops the null and keeps the
 * maximum codegen put underneath. Recorded in `docs/schema-strengthenings.md`.
 */
const supplierFormSchema = v.object({
  ...body,
  name: v.pipe(v.unwrap(body.name), v.minLength(1)),
  address: v.pipe(v.unwrap(body.address), v.minLength(1)),
  postal: v.pipe(v.unwrap(body.postal), v.minLength(1)),
  city: v.pipe(v.unwrap(body.city), v.minLength(1)),
})

/**
 * Every write validates against the strengthened create body: the form saves
 * the whole supplier it owns, and that is the component that says what a whole
 * supplier needs. The patch body it sends on an edit is a superset of that.
 */
export const supplierWrite = writeContract(Api.InventorySupplier, {
  validateWith: supplierFormSchema,
  labels: FIELD_LABELS,
})

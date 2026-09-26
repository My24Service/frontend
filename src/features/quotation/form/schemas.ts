import * as v from 'valibot'

import {
  writeContract,
  type FieldErrors,
  type FieldLabels,
} from '@/features/forms'

/**
 * What the quotation form edits: the customer it is for (picked from the
 * customers, then adjustable) and its own details. The rest of the record -
 * totals, the definitive flag, the PDF - is written by other endpoints.
 */
const FORM_FIELDS = [
  'customer_relation', 'customer_id', 'quotation_name', 'quotation_address', 'quotation_postal',
  'quotation_country_code', 'quotation_city', 'quotation_contact', 'quotation_email',
  'quotation_mobile', 'quotation_tel',
  'name', 'quotation_reference', 'quotation_expire_days', 'description',
] as const

type FormField = (typeof FORM_FIELDS)[number]

const entries = schemas.vQuotationRequest.entries
const filled = <E extends v.NullishSchema<v.GenericSchema<string>, undefined>>(entry: E) =>
  v.pipe(v.unwrap(entry), v.minLength(1))

/**
 * The form refuses a quotation without a customer (its id, name and address)
 * or a name. The API stays lax about them: the mobile app creates quotations
 * through the same endpoint without them. Case 2 in
 * docs/schema-strengthenings.md.
 */
export const quotationFormSchema = v.object({
  ...v.pick(schemas.vQuotationRequest, [...FORM_FIELDS]).entries,
  customer_id: filled(entries.customer_id),
  quotation_name: filled(entries.quotation_name),
  quotation_address: filled(entries.quotation_address),
  quotation_postal: filled(entries.quotation_postal),
  quotation_city: filled(entries.quotation_city),
  name: filled(entries.name),
})

/** The form state: the wire fields, plus the generated number shown read-only. */
export type QuotationFormValues = Required<Pick<v.InferInput<typeof schemas.vQuotationRequest>, FormField>> & {
  /** Read-only: the number the server gave the quotation. */
  quotation_id?: string
}

export type QuotationFieldErrors = FieldErrors<FormField>

export const FIELD_LABELS = {
  customer_id: () => $trans('Customer ID'),
  quotation_name: () => $trans('Customer'),
  quotation_address: () => $trans('Address'),
  quotation_postal: () => $trans('Postal'),
  quotation_country_code: () => $trans('Country'),
  quotation_city: () => $trans('City'),
  quotation_contact: () => $trans('Contacts'),
  quotation_email: () => $trans('Email'),
  quotation_mobile: () => $trans('Mobile'),
  quotation_tel: () => $trans('Phone'),
  name: () => $trans('Name'),
  quotation_reference: () => $trans('Reference'),
  quotation_expire_days: () => $trans('Expiry days'),
  description: () => $trans('Description'),
} as const satisfies FieldLabels<FormField>

export function emptyQuotation(expireDays: number | null | undefined): QuotationFormValues {
  return {
    customer_relation: null, customer_id: null, quotation_name: null, quotation_address: null,
    quotation_postal: null, quotation_country_code: null, quotation_city: null,
    quotation_contact: null, quotation_email: null, quotation_mobile: null, quotation_tel: null,
    name: null, quotation_reference: null, description: null,
    // A new quotation expires after the tenant's default, as the legacy form seeded it.
    quotation_expire_days: expireDays ?? 0,
  }
}

export function quotationFromRecord(record: Api.Quotation, expireDays: number | null | undefined): QuotationFormValues {
  const values = emptyQuotation(expireDays)
  for (const field of FORM_FIELDS) {
    const value = record[field]
    if (value !== undefined && value !== null) Object.assign(values, {[field]: value})
  }
  return {...values, quotation_id: record.quotation_id}
}

/**
 * The values as the schema reads them: a blank text is no value (`null`), so
 * a cleared field is cleared rather than refused by its format (the e-mail),
 * and the expiry days typed into a number input are a number.
 */
function shaped(values: QuotationFormValues) {
  const body: Record<string, unknown> = {}
  for (const field of FORM_FIELDS) {
    const value = values[field]
    body[field] = typeof value === 'string' && value.trim() === '' ? null : value
  }
  body.quotation_expire_days = Number(values.quotation_expire_days)
  return body
}

/**
 * Create and update send the same form fields; the patch body carries them
 * all, and the create body has no required key the form leaves out.
 */
export const quotationWrite = writeContract(Api.QuotationQuotation, {
  shape: shaped,
  labels: FIELD_LABELS,
  validateWith: quotationFormSchema,
})

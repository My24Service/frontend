import * as v from 'valibot'
import { objectPick } from '@vueuse/core'

import type { Customer } from '@/api/types.gen'
import { vCustomerCreateRequest, vPatchedCustomerRequest } from '@/api/valibot.gen'
import { normalizePhone } from '@/features/forms'
import { fieldsFromRecord } from '@/features/forms'
import { fieldErrors, requiredMessages, type FieldErrors, type FieldMessages } from '@/features/forms'
import type { FieldLabels } from '@/features/forms'
import { $trans } from '@/services/i18n'

const requiredCustomerId = <E extends {customer_id: v.NullishSchema<v.GenericSchema<string>, undefined>}>(
  entries: E,
) => v.pipe(v.unwrap(entries.customer_id), v.minLength(1))

export const customerFormSchema = v.required(
  v.object({
    ...vPatchedCustomerRequest.entries,
    customer_id: requiredCustomerId(vPatchedCustomerRequest.entries),
  }),
  ['name', 'address', 'postal', 'city', 'country_code'],
)

export const customerCreateSchema = v.object({
  ...vCustomerCreateRequest.entries,
  customer_id: requiredCustomerId(vCustomerCreateRequest.entries),
})

/** The read-only companions the panels display next to the form. */
const DISPLAY_FIELDS = ['id', 'num_orders'] as const

export type CustomerFormValues = v.InferInput<typeof vPatchedCustomerRequest> &
  Partial<Pick<Customer, (typeof DISPLAY_FIELDS)[number]>>

export function emptyCustomer(): CustomerFormValues {
  return {
    customer_id: '',
    name: '',
    address: '',
    postal: '',
    city: '',
  }
}

export function customerFromRecord(record: Customer): CustomerFormValues {
  return {
    ...emptyCustomer(),
    ...fieldsFromRecord(vPatchedCustomerRequest, record),
    // The branch pickers treat null as a state of their own ("none"), not as
    // an absent value, so a record's null reaches them as null.
    branch_partner: record.branch_partner ?? null,
    branch_id: record.branch_id ?? null,
    ...objectPick(record, [...DISPLAY_FIELDS]),
  }
}

export type CustomerFieldErrors = FieldErrors<keyof CustomerFormValues & string>


export const FIELD_LABELS = {
  customer_id: () => $trans('Customer ID'),
  name: () => $trans('Name'),
  address: () => $trans('Address'),
  postal: () => $trans('Postal'),
  city: () => $trans('City'),
  country_code: () => $trans('Country'),
} satisfies FieldLabels<keyof CustomerFormValues & string>

/** The two phone fields: a format the rule's generic line would not explain. */
export const FIELD_MESSAGES = {
  tel: () => $trans('Please provide a valid phone number'),
  mobile: () => $trans('Please provide a valid phone number'),
} satisfies FieldMessages<keyof CustomerFormValues & string>

/** The line under an untouched field: the required line, or the field's own copy. */
export const PLACEHOLDERS = { ...requiredMessages(FIELD_LABELS), ...FIELD_MESSAGES }

/**
 * The values as the wire takes them: the two phone numbers go out
 * normalized (the schema wants E.164 or blank) while the inputs keep what
 * was typed.
 */
function toWire(values: CustomerFormValues): CustomerFormValues {
  return {
    ...values,
    ...(values.tel != null ? { tel: normalizePhone(values.tel, '+31') } : {}),
    ...(values.mobile != null ? { mobile: normalizePhone(values.mobile, '+31') } : {}),
  }
}


export function validateCustomerForm(values: CustomerFormValues): CustomerFieldErrors {
  return fieldErrors(customerFormSchema, toWire(values), FIELD_MESSAGES, FIELD_LABELS)
}


export function parseCustomerCreate(
  values: CustomerFormValues,
): v.InferOutput<typeof customerCreateSchema> {
  return v.parse(customerCreateSchema, toWire(values))
}

export function parseCustomerPatch(
  values: CustomerFormValues,
): v.InferOutput<typeof customerFormSchema> {
  return v.parse(customerFormSchema, toWire(values))
}

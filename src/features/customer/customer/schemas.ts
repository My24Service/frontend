import * as v from 'valibot'
import { objectPick } from '@vueuse/core'

import type { Customer } from '@/api/types.gen'
import { vCustomerCreateRequest, vPatchedCustomerRequest } from '@/api/valibot.gen'
import { normalizePhone } from '@/features/forms/phone'
import { fieldsFromRecord } from '@/features/forms/record-fields'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
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

const MESSAGES = {
  customer_id_required: () => $trans('Please enter a customer ID'),
  name_required: () => $trans('Please enter a name'),
  address_required: () => $trans('Please enter an address'),
  postal_required: () => $trans('Please enter a postal'),
  city_required: () => $trans('Please enter a city'),
  country_required: () => $trans('Please select a country'),
  phone_invalid: () => $trans('Please provide a valid phone number'),
} as const


export const FIELD_MESSAGES = {
  customer_id: MESSAGES.customer_id_required,
  name: MESSAGES.name_required,
  address: MESSAGES.address_required,
  postal: MESSAGES.postal_required,
  city: MESSAGES.city_required,
  country_code: MESSAGES.country_required,
  tel: MESSAGES.phone_invalid,
  mobile: MESSAGES.phone_invalid,
} satisfies FieldMessages<keyof CustomerFormValues & string>

/**
 * The values as the wire takes them: the two phone numbers go out
 * normalized (the schema wants E.164 or blank) while the inputs keep what
 * was typed.
 */
function toWire(values: CustomerFormValues): CustomerFormValues {
  return {
    ...values,
    ...(values.tel != null ? { tel: normalizePhone(values.tel) } : {}),
    ...(values.mobile != null ? { mobile: normalizePhone(values.mobile) } : {}),
  }
}


export function validateCustomerForm(values: CustomerFormValues): CustomerFieldErrors {
  return fieldErrors(customerFormSchema, toWire(values), FIELD_MESSAGES)
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

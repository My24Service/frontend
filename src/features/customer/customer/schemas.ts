import * as v from 'valibot'

import type { Customer } from '@/api/types.gen'
import { vCustomerCreateRequest, vPatchedCustomerRequest } from '@/api/valibot.gen'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/shared/form-validation'
import { $trans } from '@/utils'

/**
 * The two generated request schemas, used as generated apart from the two
 * fields the API is laxer about than this form has ever been:
 *
 * - `customer_id` is nullable and blankable on the wire; the form requires it.
 * - `country_code` on create is a bare string (its choices are per-tenant, so
 *   introspection cannot enumerate them) and blank passes.
 *
 * Both are piped onto the generated entry rather than redeclared, so the
 * maxima and the create/patch differences stay wherever codegen puts them.
 * Everything else - the non-blank name/address/postal/city, the money regexes,
 * the time formats - is already in the generated schema. Copy lives in
 * FIELD_MESSAGES. See docs/schema-strengthenings.md for the backend fixes
 * that would retire these two as well.
 */

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
  country_code: v.pipe(vCustomerCreateRequest.entries.country_code, v.minLength(1)),
})

/**
 * The writable shape as the form holds it - every field optional, because a
 * fresh form has none of them yet - plus the read-only companions the record
 * carries into the view and the parse drops again.
 */
export type CustomerFormValues = v.InferInput<typeof vPatchedCustomerRequest> & {
  id?: number
  num_orders?: number
  call_out_costs_currency?: string
  hourly_rate_engineer_currency?: string
  hourly_rate_partner_engineer_currency?: string
  price_per_km_currency?: string
}

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
    id: record.id,
    num_orders: record.num_orders,
    customer_id: record.customer_id ?? '',
    name: record.name,
    address: record.address,
    postal: record.postal,
    city: record.city,
    ...(record.country_code ? {country_code: record.country_code} : {}),
    tel: record.tel ?? undefined,
    email: record.email ?? undefined,
    contact: record.contact ?? undefined,
    mobile: record.mobile ?? undefined,
    remarks: record.remarks ?? undefined,
    external_identifier: record.external_identifier ?? undefined,
    maintenance_contract: record.maintenance_contract ?? undefined,
    ...(record.products_without_tax !== undefined
      ? {products_without_tax: record.products_without_tax}
      : {}),
    ...(record.standard_hours_hour !== undefined
      ? {standard_hours_hour: record.standard_hours_hour}
      : {}),
    ...(record.standard_hours_minute !== undefined
      ? {standard_hours_minute: record.standard_hours_minute}
      : {}),
    branch_partner: record.branch_partner ?? null,
    branch_id: record.branch_id ?? null,
    ...(record.use_branch_address !== undefined
      ? {use_branch_address: record.use_branch_address}
      : {}),
    call_out_costs: record.call_out_costs,
    call_out_costs_currency: record.call_out_costs_currency,
    hourly_rate_engineer: record.hourly_rate_engineer,
    hourly_rate_engineer_currency: record.hourly_rate_engineer_currency,
    hourly_rate_partner_engineer: record.hourly_rate_partner_engineer,
    hourly_rate_partner_engineer_currency: record.hourly_rate_partner_engineer_currency,
    price_per_km: record.price_per_km,
    price_per_km_currency: record.price_per_km_currency,
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
} as const


export const FIELD_MESSAGES = {
  customer_id: MESSAGES.customer_id_required,
  name: MESSAGES.name_required,
  address: MESSAGES.address_required,
  postal: MESSAGES.postal_required,
  city: MESSAGES.city_required,
  country_code: MESSAGES.country_required,
} satisfies FieldMessages<keyof CustomerFormValues & string>


export function validateCustomerForm(values: CustomerFormValues): CustomerFieldErrors {
  return fieldErrors(customerFormSchema, values, FIELD_MESSAGES)
}


export function parseCustomerCreate(
  values: CustomerFormValues,
): v.InferOutput<typeof customerCreateSchema> {
  return v.parse(customerCreateSchema, values)
}

export function parseCustomerPatch(
  values: CustomerFormValues,
): v.InferOutput<typeof customerFormSchema> {
  return v.parse(customerFormSchema, values)
}

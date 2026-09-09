import * as v from 'valibot'

import type { Customer } from '@/api/types.gen'
import { vCustomerCreateWritable, vPatchedCustomerWritable } from '@/api/valibot.gen'
import { $trans } from '@/utils'



const identityStrengthenings = {
  customer_id: v.pipe(v.string(), v.minLength(1, $trans('Please enter a customer ID')), v.maxLength(100)),
  name: v.pipe(v.string(), v.minLength(1, $trans('Please enter a name')), v.maxLength(255)),
  address: v.pipe(v.string(), v.minLength(1, $trans('Please enter an address')), v.maxLength(255)),
  postal: v.pipe(v.string(), v.minLength(1, $trans('Please enter a postal')), v.maxLength(20)),
  city: v.pipe(v.string(), v.minLength(1, $trans('Please enter a city')), v.maxLength(255)),
  country_code: v.pipe(v.string(), v.minLength(1, $trans('Please select a country')), v.maxLength(2)),
}


export const customerFormSchema = v.object({
  ...vPatchedCustomerWritable.entries,
  ...identityStrengthenings,
})


export const customerCreateSchema = v.object({
  ...vCustomerCreateWritable.entries,
  ...identityStrengthenings,
})


export type CustomerFormValues = {
  customer_id: string
  name: string
  address: string
  postal: string
  city: string
  country_code?: string

  tel?: string
  email?: string
  contact?: string
  mobile?: string
  remarks?: string
  external_identifier?: string
  maintenance_contract?: string
  products_without_tax?: boolean
  standard_hours_hour?: number
  standard_hours_minute?: number
  branch_partner?: number | null
  branch_id?: number | null
  use_branch_address?: boolean

  call_out_costs?: string
  hourly_rate_engineer?: string
  hourly_rate_partner_engineer?: string
  price_per_km?: string

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


export type CustomerFieldErrors = Partial<Record<keyof CustomerFormValues, string>>

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
} as const


export function validateCustomerForm(values: CustomerFormValues): CustomerFieldErrors {
  const result = v.safeParse(customerFormSchema, values)
  const errors: CustomerFieldErrors = {}
  if (!result.success) {
    for (const issue of result.issues) {
      const field = issue.path?.[0]?.key as keyof CustomerFormValues | undefined
      if (!field || errors[field]) continue
      errors[field] = String(issue.message)
    }
  }
  return errors
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

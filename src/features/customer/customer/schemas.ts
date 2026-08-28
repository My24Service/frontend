import * as v from 'valibot'

import type { Customer } from '@/api/types.gen'
import { vCustomerCreateWritable, vPatchedCustomerWritable } from '@/api/valibot.gen'
import { $trans } from '@/utils'

/**
 * The Customer form's validation, derived from the generated request schemas.
 *
 * Customer's two write shapes differ, unlike Member's: `POST` (create) takes
 * the identity fields only, while `PATCH` (edit) also carries the prices, the
 * standard hours and the branch linkage. Both generated schemas are spread
 * here — one for validating everything the form can edit, one for the create
 * body — with the same named strengthenings on top, each with a reason:
 *
 *   - DRF's `required=True` means "present and not blank" on the backend
 *     (`allow_blank` defaults to False), but reaches the generated schema
 *     only as a plain `string` — an empty string would parse and then be
 *     rejected with "This field may not be blank". `minLength(1)` until the
 *     generator emits required-ness (the request-schema correctness ticket).
 *
 * The parse output is the request body — which is why saved bodies contain
 * exactly the fields the API declares, and the readonly response fields
 * (`id`, the `*_currency` strings, `documents`, `branch_view`, the counts)
 * die at the parse instead of riding the wire.
 */

const identityStrengthenings = {
  customer_id: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
  address: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
  postal: v.pipe(v.string(), v.minLength(1), v.maxLength(20)),
  city: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
  country_code: v.pipe(v.string(), v.minLength(1), v.maxLength(2)),
}

/** Everything the form can edit, as the edit (PATCH) endpoint accepts it. */
export const customerFormSchema = v.object({
  ...vPatchedCustomerWritable.entries,
  ...identityStrengthenings,
})

/** What a create may send: the identity fields, and nothing else. */
export const customerCreateSchema = v.object({
  ...vCustomerCreateWritable.entries,
  ...identityStrengthenings,
})

/** What the form edits before it is valid: a customer-shaped slate. */
export type CustomerFormValues = {
  customer_id: string
  name: string
  address: string
  postal: string
  city: string
  country_code?: string
  // The nullish text fields carry `undefined` while untouched, never null:
  // an untouched field drops out of the parse (absent on the wire, as the
  // legacy model's undefined keys were), a cleared field sends ''.
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
  // (branch_partner/branch_id stay nullable: null is a meaningful choice —
  // "no partner" — the select's placeholder option produces.)
  call_out_costs?: string
  hourly_rate_engineer?: string
  hourly_rate_partner_engineer?: string
  price_per_km?: string
  // Display-only: the currencies the PriceInput shows, the order count the
  // branch panel prints, and the id the documents panel keys on. The parse
  // drops every one of them from the wire.
  id?: number
  num_orders?: number
  call_out_costs_currency?: string
  hourly_rate_engineer_currency?: string
  hourly_rate_partner_engineer_currency?: string
  price_per_km_currency?: string
}

/**
 * A new customer as the legacy screen opened one: blank, with no country
 * picked and no prices seeded. (The legacy `created()` replaced its own
 * price-defaulted data with an empty model; this is that empty model.)
 */
export function emptyCustomer(): CustomerFormValues {
  return {
    customer_id: '',
    name: '',
    address: '',
    postal: '',
    city: '',
  }
}

/**
 * The writable slice of a loaded record, plus the display-only fields the
 * template reads (the currencies, the order count, the id). Deliberately the
 * same merge the legacy `loadData` performed — record values win, absent
 * optional fields stay absent — minus the stored state no input edits.
 */
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

/** Field-level copy, keyed by field. A missing key means the field passed. */
export type CustomerFieldErrors = Partial<Record<keyof CustomerFormValues, string>>

const MESSAGES = {
  customer_id_required: () => $trans('Please enter a customer ID'),
  name_required: () => $trans('Please enter a name'),
  address_required: () => $trans('Please enter an address'),
  postal_required: () => $trans('Please enter a postal'),
  city_required: () => $trans('Please enter a city'),
  country_required: () => $trans('Please select a country'),
} as const

/**
 * The copy a field shows while it simply sits empty, before any submit —
 * the same words {@link validateCustomerForm} reports once that field fails.
 * Templates use these instead of restating the strings, so a wording change
 * happens in this file and nowhere else.
 */
export const FIELD_MESSAGES = {
  customer_id: MESSAGES.customer_id_required,
  name: MESSAGES.name_required,
  address: MESSAGES.address_required,
  postal: MESSAGES.postal_required,
  city: MESSAGES.city_required,
  country_code: MESSAGES.country_required,
} as const

/**
 * Validate form values against the edit schema — the superset of the two
 * write shapes — returning one message per broken field. Which fields broke
 * comes from the schema's issues; the message is this screen's copy for that
 * failure kind. The legacy screen validated these six fields (Vuelidate
 * `required`), no more; so does this.
 */
export function validateCustomerForm(values: CustomerFormValues): CustomerFieldErrors {
  const result = v.safeParse(customerFormSchema, values)

  const errors: CustomerFieldErrors = {}
  if (!result.success) {
    for (const issue of result.issues) {
      const field = issue.path?.[0]?.key as keyof CustomerFormValues | undefined
      if (!field || errors[field]) continue

      errors[field] = messageFor(field, issue)
    }
  }

  return errors
}

function messageFor(
  field: keyof CustomerFormValues,
  issue: v.InferIssue<typeof customerFormSchema>,
): string {
  switch (field) {
    case 'customer_id': return MESSAGES.customer_id_required()
    case 'name': return MESSAGES.name_required()
    case 'address': return MESSAGES.address_required()
    case 'postal': return MESSAGES.postal_required()
    case 'city': return MESSAGES.city_required()
    case 'country_code': return MESSAGES.country_required()
    default: return String(issue.message)
  }
}

/**
 * The request bodies for a save: the form values through the endpoint's own
 * request schema, so what goes on the wire is exactly what the API declares —
 * typed, stripped of keys it does not know, and only ever called after
 * {@link validateCustomerForm} passed.
 */
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

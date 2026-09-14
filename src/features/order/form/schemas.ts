import * as v from 'valibot'

import type { EngineerInfoLine, OrderDetail, OrderLine } from '@/api/types.gen'
import {
  vEngineerInfoLineRequest,
  vOrderCreateBranchEmployeeRequest,
  vOrderCreateBranchRequest,
  vOrderCreateCustomerRelationRequest,
  vOrderCreateCustomerRequest,
  vOrderLineCreateUpdateRequest,
  vOrderUpdateCustomerRequest,
  vOrderUpdateRequest,
} from '@/api/valibot.gen'
import { fieldErrors, type FieldErrors, type FieldMessages } from '@/features/forms/validation'
import { $trans } from '@/services/i18n'

/**
 * Who is filling the order form. The backend has one create serializer per
 * role (and, for planning, per tenant shape), and the generated request
 * union names the four; the role picks one.
 *
 * - `planning`: a planning, staff or admin user — the full form.
 * - `customer`: a customer user without branches, ordering for their own
 *   company: no owner pickers, no engineers, no infolines.
 * - `employee`: a branch employee — the branch is their own, no customer,
 *   no engineers, no infolines.
 */
export type FormRole = 'planning' | 'customer' | 'employee'

export interface FormVariant {
  role: FormRole
  hasBranches: boolean
}

// The write schemas ----------------------------------------------------------

/**
 * Format a Date as the `YYYY-MM-DD` the DateFields expect — local-time
 * getters, not `toISOString()`, which reports the previous day for any
 * evening in CET.
 */
export function toApiDate(value: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

/** The datepicker binds a Date; the wire takes the API string. */
const apiDate = () =>
  v.pipe(
    v.union([v.string(), v.date()]),
    v.transform((value) => (typeof value === 'string' ? value : toApiDate(value))),
  )

/**
 * The time inputs take `HH:mm`; the serializer declares `HH:mm:ss`. A blank
 * time is absent from the body (the legacy deleted the key), an `HH:mm`
 * gains its seconds, and anything else fails the generated rule.
 */
const apiTime = () =>
  v.pipe(
    v.optional(v.nullable(v.string())),
    v.transform((value) => {
      if (value == null || value === '') return undefined
      return /^\d{1,2}:\d{2}$/.test(value) ? `${value.padStart(5, '0')}:00` : value
    }),
    v.optional(v.pipe(v.string(), v.isoTimeSecond())),
  )

/**
 * A create body starts from its generated request component and takes the
 * form's date/time spellings; a required entry codegen already carries
 * stays required. `order_type` is required by every variant, but the form
 * starts it as '' (an unpicked select), so it is pinned to non-empty here.
 */
function createSchemaOf<T extends v.ObjectEntries>(component: v.ObjectSchema<T, undefined>) {
  return v.object({
    ...component.entries,
    order_type: v.pipe(v.string(), v.minLength(1)),
    start_date: apiDate(),
    end_date: apiDate(),
    start_time: apiTime(),
    end_time: apiTime(),
  })
}

export const orderCreateBranchSchema = createSchemaOf(vOrderCreateBranchRequest)
export const orderCreateCustomerRelationSchema = createSchemaOf(vOrderCreateCustomerRelationRequest)
export const orderCreateCustomerSchema = createSchemaOf(vOrderCreateCustomerRequest)
export const orderCreateBranchEmployeeSchema = createSchemaOf(vOrderCreateBranchEmployeeRequest)

export const orderUpdateSchema = createSchemaOf(vOrderUpdateRequest)
export const orderUpdateCustomerSchema = createSchemaOf(vOrderUpdateCustomerRequest)

export function orderCreateSchemaFor({role, hasBranches}: FormVariant) {
  switch (role) {
    case 'planning':
      return hasBranches ? orderCreateBranchSchema : orderCreateCustomerRelationSchema
    case 'customer':
      return orderCreateCustomerSchema
    case 'employee':
      return orderCreateBranchEmployeeSchema
  }
}

export function orderUpdateSchemaFor({role}: FormVariant) {
  return role === 'customer' ? orderUpdateCustomerSchema : orderUpdateSchema
}

export type OrderCreateBody = v.InferOutput<ReturnType<typeof orderCreateSchemaFor>>
export type OrderUpdateBody = v.InferOutput<ReturnType<typeof orderUpdateSchemaFor>>
export type OrderBody = OrderCreateBody | OrderUpdateBody

// The form values -------------------------------------------------------------

/**
 * What the form binds to: the superset of the four create bodies, with the
 * pickers empty until chosen and the dates as the Date objects the
 * datepicker hands over. `orderlines`, `infolines`, the engineers and the
 * documents are staged beside it, not in it — they are their own resources.
 */
export interface OrderFormValues {
  customer_id: string
  customer_reference: string
  order_reference: string
  order_type: string
  customer_remarks: string
  description: string
  start_date: Date | null
  start_time: string
  end_date: Date | null
  end_time: string
  remarks: string
  external_identifier: string
  order_name: string
  order_address: string
  order_postal: string
  order_city: string
  order_country_code: string
  order_tel: string
  order_mobile: string
  order_email: string
  order_contact: string
  branch: number | null
  customer_relation: number | null
  quotation: number | null
  order_email_extra: string[]
  planning_remarks: string
}

/**
 * The default start/end date: the next working day, computed per call so a
 * session left open past midnight does not keep handing out yesterday's
 * tomorrow.
 */
export function nextWorkingDay(from: Date = new Date()): Date {
  const date = new Date(from)
  date.setDate(date.getDate() + 1)
  if (date.getDay() === 0) date.setDate(date.getDate() + 1)
  else if (date.getDay() === 6) date.setDate(date.getDate() + 2)
  return date
}

export function emptyOrder(): OrderFormValues {
  return {
    customer_id: '',
    customer_reference: '',
    order_reference: '',
    order_type: '',
    customer_remarks: '',
    description: '',
    start_date: nextWorkingDay(),
    end_date: nextWorkingDay(),
    start_time: '',
    end_time: '',
    remarks: '',
    external_identifier: '',
    order_name: '',
    order_address: '',
    order_postal: '',
    order_city: '',
    order_country_code: 'NL',
    order_tel: '',
    order_mobile: '',
    order_email: '',
    order_contact: '',
    branch: null,
    customer_relation: null,
    quotation: null,
    order_email_extra: [],
    planning_remarks: '',
  }
}

/** The detail's `DD/MM/YYYY` display date back to a Date; the `_iso` twin is preferred when present. */
function dateOf(display: string, iso: string | null | undefined): Date | null {
  if (iso) {
    const [year, month, day] = iso.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const [day, month, year] = display.split('/').map(Number)
  return Number.isFinite(year) ? new Date(year, month - 1, day) : null
}

/** `HH:mm:ss` from the detail to the `HH:mm` the input shows. */
function timeOf(value: string | null | undefined): string {
  if (!value) return ''
  return value.length >= 5 ? value.slice(0, 5) : value
}

export function orderFromRecord(record: OrderDetail): OrderFormValues {
  return {
    customer_id: record.customer_id ?? '',
    customer_reference: record.customer_reference ?? '',
    order_reference: record.order_reference ?? '',
    // the legacy trimmed the type: a stored value once carried whitespace
    order_type: (record.order_type ?? '').trim(),
    customer_remarks: record.customer_remarks ?? '',
    description: record.description ?? '',
    start_date: dateOf(record.start_date, record.start_date_iso),
    end_date: dateOf(record.end_date, record.end_date_iso),
    start_time: timeOf(record.start_time),
    end_time: timeOf(record.end_time),
    remarks: record.remarks ?? '',
    // the detail serializer does not carry these two; an edit leaves them as they are
    external_identifier: '',
    order_name: record.order_name,
    order_address: record.order_address ?? '',
    order_postal: record.order_postal ?? '',
    order_city: record.order_city ?? '',
    order_country_code: record.order_country_code ?? 'NL',
    order_tel: record.order_tel ?? '',
    order_mobile: record.order_mobile ?? '',
    order_email: record.order_email ?? '',
    order_contact: record.order_contact ?? '',
    branch: record.branch ?? null,
    customer_relation: record.customer_relation ?? null,
    quotation: null,
    order_email_extra: record.order_email_extra ?? [],
    planning_remarks: record.planning_remarks ?? '',
  }
}

// Validation ------------------------------------------------------------------

export type OrderFieldErrors = FieldErrors<
  | 'customer_relation'
  | 'branch'
  | 'order_name'
  | 'order_address'
  | 'order_postal'
  | 'order_city'
  | 'order_type'
  | 'start_date'
  | 'end_date'
  | 'start_time'
  | 'end_time'
  | 'orderlines'
>

export const FIELD_MESSAGES = {
  customer_relation: () => $trans('Please select a customer'),
  branch: () => $trans('Please select a branch'),
  order_name: () => $trans('Please enter the name'),
  order_address: () => $trans('Please enter the address'),
  order_postal: () => $trans('Please enter the postal'),
  order_city: () => $trans('Please enter the city'),
  order_type: () => $trans('Please select an order type'),
  start_date: () => $trans('Please enter a start date'),
  end_date: () => $trans('Please enter an end date'),
  start_time: () => $trans('Please enter a valid start time HH:mm'),
  end_time: () => $trans('Please enter a valid end time HH:mm'),
} satisfies FieldMessages<Exclude<keyof OrderFieldErrors, 'orderlines'>>

/**
 * The address fields the legacy forms required beyond what the serializers
 * do: the serializers accept a blank address, the planning and employee
 * forms never did.
 */
const ADDRESS_REQUIRED = ['order_address', 'order_postal', 'order_city'] as const

/**
 * The values as the schema sees them: the pickers' `null` becomes an absent
 * key so a nullish entry accepts it, and a blank optional string is absent
 * rather than `''` — the parse output is the body, and an absent key on a
 * PATCH/PUT leaves the stored value alone where `''` would blank it.
 */
function wireValues(values: OrderFormValues, {isCreate}: {isCreate: boolean}) {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === '') continue
    if (Array.isArray(value) && value.length === 0 && key !== 'order_email_extra') continue
    out[key] = value
  }
  // A quotation is set at creation only; the update serializers do not declare it.
  if (!isCreate) delete out.quotation
  return out
}

export function validateOrderForm(
  values: OrderFormValues,
  variant: FormVariant,
  context: {isCreate: boolean},
): OrderFieldErrors {
  const schema = context.isCreate ? orderCreateSchemaFor(variant) : orderUpdateSchemaFor(variant)
  const errors = fieldErrors<keyof OrderFieldErrors>(schema, wireValues(values, context), FIELD_MESSAGES)

  if (variant.role !== 'customer') {
    for (const field of ADDRESS_REQUIRED) {
      if (!values[field].trim() && !errors[field]) errors[field] = FIELD_MESSAGES[field]()
    }
  }
  // An edit keeps its owner from the record; the update serializers do not
  // require one, but a planning edit that lost it would strand the order.
  if (!context.isCreate && variant.role === 'planning') {
    if (variant.hasBranches && values.branch === null) errors.branch = FIELD_MESSAGES.branch()
    if (!variant.hasBranches && values.customer_relation === null) {
      errors.customer_relation = FIELD_MESSAGES.customer_relation()
    }
  }
  if (!values.start_date) errors.start_date = FIELD_MESSAGES.start_date()
  if (!values.end_date) errors.end_date = FIELD_MESSAGES.end_date()

  return errors
}

export function parseOrderBody(
  values: OrderFormValues,
  variant: FormVariant,
  context: {isCreate: boolean},
): OrderBody {
  const schema = context.isCreate ? orderCreateSchemaFor(variant) : orderUpdateSchemaFor(variant)
  return v.parse(schema, wireValues(values, context))
}

// Orderlines ------------------------------------------------------------------

export const orderlineSchema = v.object({
  ...vOrderLineCreateUpdateRequest.entries,
})

export type OrderlineBody = v.InferOutput<typeof orderlineSchema>

/** A staged orderline: the wire fields plus the names the pickers chose. */
export interface OrderlineRow {
  id?: number
  product: string
  location: string
  remarks: string
  equipment: number | null
  equipment_location: number | null
  amount?: number | null
  maintenance_contract?: number | null
}

export function emptyOrderline(): OrderlineRow {
  return {product: '', location: '', remarks: '', equipment: null, equipment_location: null}
}

export function orderlineFromRecord(record: OrderLine): OrderlineRow {
  return {
    id: record.id,
    product: record.product ?? '',
    location: record.location ?? '',
    remarks: record.remarks ?? '',
    equipment: record.equipment ?? null,
    equipment_location: record.equipment_location ?? null,
    amount: record.amount ?? null,
    maintenance_contract: record.maintenance_contract ?? null,
  }
}

export function isOrderlineComplete(row: OrderlineRow): boolean {
  return row.product.trim() !== '' && row.location.trim() !== ''
}

export function parseOrderlineBody(row: OrderlineRow, orderId: number): OrderlineBody {
  return v.parse(orderlineSchema, {
    order: orderId,
    product: row.product,
    location: row.location,
    remarks: row.remarks,
    ...(row.equipment !== null ? {equipment: row.equipment} : {}),
    ...(row.equipment_location !== null ? {equipment_location: row.equipment_location} : {}),
    ...(row.amount != null ? {amount: row.amount} : {}),
    ...(row.maintenance_contract != null ? {maintenance_contract: row.maintenance_contract} : {}),
  })
}

// Infolines -------------------------------------------------------------------

export const infolineSchema = v.object({
  ...vEngineerInfoLineRequest.entries,
  info: v.pipe(v.string(), v.minLength(1)),
})

export type InfolineBody = v.InferOutput<typeof infolineSchema>

export interface InfolineRow {
  id?: number
  info: string
}

export function infolineFromRecord(record: EngineerInfoLine): InfolineRow {
  return {id: record.id, info: record.info ?? ''}
}

export function parseInfolineBody(row: InfolineRow, orderId: number): InfolineBody {
  return v.parse(infolineSchema, {order: orderId, info: row.info})
}

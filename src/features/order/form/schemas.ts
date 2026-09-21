import * as v from 'valibot'

import type { EngineerInfoLine, EngineerInfoLineNested, OrderDetail, OrderLine, OrderLineNested, OrderLineNestedRequest } from '@/api/types.gen'
import {
  vEngineerInfoLineNestedRequest,
  vOrderCreateBranchEmployeeRequest,
  vOrderCreateBranchRequest,
  vOrderCreateCustomerRelationRequest,
  vOrderCreateCustomerRequest,
  vOrderLineNestedRequest,
  vPatchedOrderUpdateCustomerRequest,
  vPatchedOrderUpdateRequest,
} from '@/api/valibot.gen'
import {
  fieldErrors,
  requiredMessage,
  selectMessage,
  type FieldErrors,
  type FieldMessages,
} from '@/features/forms'
import type { FieldLabels } from '@/features/forms'
import { toApiDate } from '@/features/forms'
import { completeTime } from '@/features/forms'
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
      return completeTime(value)
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

// The contract has no PUT, so the update bodies are the `Patched` PATCH
// components. They declare the same fields, with the same optionality, as the
// PUT components did.
export const orderUpdateSchema = createSchemaOf(vPatchedOrderUpdateRequest)
export const orderUpdateCustomerSchema = createSchemaOf(vPatchedOrderUpdateCustomerRequest)

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
 * What the form holds, before the adjustments below: the planning branch
 * variant's input. The two planning variants declare the same keys and
 * differ only in which owner is required, so one component's input covers
 * the form's fields. It is the generated component, not the schema above:
 * the schema redeclares the date, time and type entries in the form's
 * spellings, and deriving from a redeclaration does not see through it.
 */
type OrderCreateInput = v.InferInput<typeof vOrderCreateBranchRequest>

type OrderContactFields =
  | 'customer_id' | 'order_name'
  | 'order_address' | 'order_postal' | 'order_city'
  | 'order_country_code' | 'order_tel' | 'order_mobile'
  | 'order_email' | 'order_contact' | 'customer_remarks' | 'customer_relation'

/**
 * The contact block an owner pick fills: the customer or branch the order is
 * for, copied onto the order's own address, phone and contact fields. It is
 * the whole contract the owner pickers (`use-order-pickers.ts`) need, so a
 * form that only creates an order — like the engineer-event attach modal —
 * satisfies it without holding the full form values.
 */
export type OrderContactBlock = Pick<OrderCreateInput, OrderContactFields> & {
  // a picker that is empty rather than absent until chosen
  customer_id: string | null
  customer_relation: number | null
}

/**
 * What the form binds to: the create body's fields, with the pickers empty
 * until chosen and the dates as the Date objects the datepicker hands over.
 * `orderlines`, `infolines`, the engineers and the documents are staged
 * beside it, not in it: the first two ride along in the order body
 * (`parseOrderBody`), the other two are their own resources.
 */
export type OrderFormValues =
  Omit<OrderCreateInput, OrderContactFields
    // a picker that is empty rather than absent until chosen
    | 'branch' | 'quotation'
    // the datepicker binds a Date; the time inputs take HH:mm
    | 'start_date' | 'start_time' | 'end_date' | 'end_time'
    // staged beside the values, riding the body instead
    | 'orderlines' | 'infolines'
  >
  & OrderContactBlock
  & {
    // a picker that is empty rather than absent until chosen
    branch: number | null
    quotation: number | null
    // the datepicker binds a Date; empty rather than absent
    start_date: Date | null
    end_date: Date | null
    // the time inputs take HH:mm; blank until typed
    start_time: string
    end_time: string
    // always held, so inputs stay controlled
    order_email_extra: string[]
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
    external_identifier: record.external_identifier ?? '',
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
    quotation: record.quotation ?? null,
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

export const FIELD_LABELS = {
  customer_relation: () => $trans('Customer'),
  branch: () => $trans('Branch'),
  order_name: () => $trans('Name'),
  order_address: () => $trans('Address'),
  order_postal: () => $trans('Postal'),
  order_city: () => $trans('City'),
  order_type: () => $trans('Order type'),
  start_date: () => $trans('Start date'),
  end_date: () => $trans('End date'),
  start_time: () => $trans('Start time'),
  end_time: () => $trans('End time'),
} satisfies FieldLabels<Exclude<keyof OrderFieldErrors, 'orderlines'>>

/**
 * The pickers are chosen rather than typed, which the schema cannot tell
 * once `wireValues` has dropped their null; the two times take a shape the
 * rule's line would not say.
 */
export const FIELD_MESSAGES = {
  customer_relation: () => selectMessage(FIELD_LABELS.customer_relation()),
  branch: () => selectMessage(FIELD_LABELS.branch()),
  order_type: () => selectMessage(FIELD_LABELS.order_type()),
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
  const errors = fieldErrors<keyof OrderFieldErrors>(schema, wireValues(values, context), FIELD_MESSAGES, FIELD_LABELS)

  if (variant.role !== 'customer') {
    for (const field of ADDRESS_REQUIRED) {
      if (!values[field]?.trim() && !errors[field]) errors[field] = requiredMessage(FIELD_LABELS[field]())
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
  if (!values.start_date) errors.start_date = requiredMessage(FIELD_LABELS.start_date())
  if (!values.end_date) errors.end_date = requiredMessage(FIELD_LABELS.end_date())

  return errors
}

/**
 * The staged child rows that ride along in the order body. Each list is a
 * replace-set on the server: rows with an id are updated, rows without are
 * created, stored rows absent from the list are deleted. A list left out
 * leaves those rows alone, so a form without the panel sends none.
 */
export interface OrderChildren {
  orderlines?: OrderlineRow[]
  infolines?: InfolineRow[]
}

export function parseOrderBody(
  values: OrderFormValues,
  variant: FormVariant,
  context: {isCreate: boolean},
  children: OrderChildren = {},
): OrderBody {
  const schema = context.isCreate ? orderCreateSchemaFor(variant) : orderUpdateSchemaFor(variant)
  // An empty list is a meaningful value here (delete every stored row), so
  // it is added after wireValues, which drops empty arrays.
  return v.parse(schema, {
    ...wireValues(values, context),
    ...(children.orderlines ? {orderlines: children.orderlines.map(parseOrderlineBody)} : {}),
    ...(children.infolines ? {infolines: children.infolines.map(parseInfolineBody)} : {}),
  })
}

// Orderlines ------------------------------------------------------------------

/** One row of the order body's `orderlines`; `id` names the stored row to update. */
export const orderlineSchema = v.object({
  ...vOrderLineNestedRequest.entries,
})

/**
 * A staged orderline: the row's identity comes from the nested component,
 * and the staged fields are the form's held spellings — strings blank until
 * typed, picks empty until chosen, and null where the wire takes an absent
 * key.
 */
export type OrderlineRow = Pick<v.InferInput<typeof orderlineSchema>, 'id'> & {
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

export function orderlineFromRecord(record: OrderLine | OrderLineNested): OrderlineRow {
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

export function parseOrderlineBody(row: OrderlineRow): OrderLineNestedRequest {
  return v.parse(orderlineSchema, {
    ...(row.id != null ? {id: row.id} : {}),
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

/** One row of the order body's `infolines`; `id` names the stored row to update. */
export const infolineSchema = v.object({
  ...vEngineerInfoLineNestedRequest.entries,
  info: v.pipe(v.string(), v.minLength(1)),
})

export type InfolineBody = v.InferOutput<typeof infolineSchema>

export type InfolineRow = Pick<v.InferInput<typeof infolineSchema>, 'id'> & {
  /** Held, not absent: blank until typed, which the schema's minimum then refuses. */
  info: string
}

export function infolineFromRecord(record: EngineerInfoLine | EngineerInfoLineNested): InfolineRow {
  return {id: record.id, info: record.info ?? ''}
}

export function parseInfolineBody(row: InfolineRow): InfolineBody {
  return v.parse(infolineSchema, {...(row.id != null ? {id: row.id} : {}), info: row.info})
}

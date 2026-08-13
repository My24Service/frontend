import * as v from 'valibot'
import { bool, fk, int, nullableStr, str, timestamp, view } from '../schema'

/**
 * Valibot schemas for the Order endpoints.
 *
 * A single `orderService` talks to several different backend serializers, so
 * there is no one "Order shape". The backend already factors this well -
 * apps/order/serializers/order.py declares shared field tuples
 * (ORDER_ID_FIELDS, ORDER_REFERENCE_FIELDS, ORDER_TIME_FIELDS,
 * ORDER_ADDRESS_FIELDS) composed into ORDER_BASE_FIELDS, which every read
 * serializer starts from. The entry groups below mirror those tuples one to
 * one, so a change on either side is easy to spot.
 *
 * Which serializer answers which call:
 *
 *   queryMode 'all' / all_for_customer_web   -> OrderSerializer
 *   queryMode 'dispatch'|'inprogress'|
 *     'finished' / get_within_range          -> OrderDispatchSerializer
 *   all_for_equipment_location               -> OrderListWithAcceptedSerializer
 *                                               (alias of OrderSerializer)
 *   detail / detailUuid                      -> OrderDetailSerializer
 *   getAllForCustomer (history)              -> OrderCustomerHistorySerializer
 */

// ─────────────────────────────────────────────────────────────────────────────
// Field groups - mirroring the backend's shared tuples
// ─────────────────────────────────────────────────────────────────────────────

/** `ORDER_ID_FIELDS` */
const idEntries = {
  id: fk(),
  uuid: nullableStr(),
  customer_id: nullableStr(''),
  order_id: nullableStr(''),
  customer_reference: nullableStr(''),
}

/** `ORDER_REFERENCE_FIELDS` */
const referenceEntries = {
  order_reference: nullableStr(''),
  order_type: nullableStr(null),
  customer_remarks: nullableStr(''),
  description: nullableStr(''),
}

/**
 * `ORDER_TIME_FIELDS`
 *
 * `start_date`/`end_date` are non-null DateFields on the model and arrive as
 * strings. `start_time`/`end_time` are nullable TimeFields, reformatted by
 * LocalizedDateMixin when `format_times` is set. `order_date` is a
 * SerializerMethodField reading a model property, so it is read-only.
 */
const timeEntries = {
  start_date: str(),
  start_time: nullableStr(null),
  end_date: str(),
  end_time: nullableStr(null),
  order_date: nullableStr(''),
  remarks: nullableStr(''),
}

/** `ORDER_ADDRESS_FIELDS` */
const addressEntries = {
  order_name: str(),
  order_address: nullableStr(''),
  order_postal: nullableStr(''),
  order_city: nullableStr(''),
  order_country_code: nullableStr('NL'),
  order_tel: nullableStr(''),
  order_mobile: nullableStr(''),
  order_email: nullableStr(''),
  order_contact: nullableStr(''),
}

/** `models.Order.status_field` - three read-only SerializerMethodFields. */
const statusEntries = {
  last_status: nullableStr(),
  last_status_full: nullableStr(),
  last_status_date: nullableStr(),
}

/** `ORDER_BASE_FIELDS` - present in virtually every read serializer. */
export const OrderBaseSchema = v.object({
  ...idEntries,
  ...referenceEntries,
  ...timeEntries,
  ...addressEntries,
})

// ─────────────────────────────────────────────────────────────────────────────
// Shared computed/nested entries contributed by the read mixins
// ─────────────────────────────────────────────────────────────────────────────

/** `WorkorderUrlMixin` */
const workorderUrlEntries = {
  workorder_pdf_url: nullableStr(''),
  workorder_pdf_url_partner: nullableStr(''),
  workorder_url: nullableStr(''),
}

/** `WorkorderDocumentsMixin` - a list of `{url, name}`. */
const WorkorderDocumentSchema = v.object({
  url: str(),
  name: str(),
})

/** `StatusesMixin` - nested OrderStatusSerializer, newest first. */
const OrderStatusSchema = v.object({
  id: fk(),
  status: nullableStr(''),
  created: timestamp(),
})

/** `AssignmentInfoMixin.get_assigned_user_info` (the simple variant). */
const AssignedUserInfoSchema = v.object({
  user_id: fk(),
  full_name: nullableStr(''),
  license_plate: nullableStr(),
  // Only OrderDetailSerializer's override adds this.
  booked: v.optional(v.number()),
})

/**
 * `AssignmentInfoMixin`
 *
 * `required_assigned` and `customer_rate_avg` both return the string `'-'` as
 * their empty case, so neither is reliably numeric.
 */
const assignmentEntries = {
  required_assigned: v.optional(v.union([v.string(), v.number()]), '-'),
  user_order_available_set_count: int(),
  assigned_count: int(),
  assigned_user_info: v.optional(v.array(AssignedUserInfoSchema), () => []),
  customer_rate_avg: v.optional(v.union([v.string(), v.number()]), '-'),
  materials: v.optional(v.array(v.record(v.string(), v.unknown())), () => []),
  reported_codes_extra_data: v.optional(
    v.array(v.object({ statuscode: nullableStr(''), extra_data: v.unknown() })),
    () => [],
  ),
}

const nestedEntries = {
  documents: v.optional(v.array(v.record(v.string(), v.unknown())), () => []),
  orderlines: v.optional(v.array(v.record(v.string(), v.unknown())), () => []),
  infolines: v.optional(v.array(v.record(v.string(), v.unknown())), () => []),
  statuses: v.optional(v.array(OrderStatusSchema), () => []),
  workorder_documents: v.optional(v.array(WorkorderDocumentSchema), () => []),
}

/** `MoneyField` - rendered as a string by djmoney/DRF. */
const moneyEntries = {
  total_price_purchase: v.optional(v.union([v.string(), v.number(), v.null()]), null),
  total_price_selling: v.optional(v.union([v.string(), v.number(), v.null()]), null),
}

/**
 * `order_email_extra` is `ListField(child=EmailField(), default=list)` on the
 * backend and a JSONField defaulting to `list` on the model - it is an array of
 * addresses, never a string.
 */
const orderEmailExtra = v.optional(v.array(v.string()), () => [])

// ─────────────────────────────────────────────────────────────────────────────
// Read schemas
// ─────────────────────────────────────────────────────────────────────────────

/** `OrderSerializer` (aliased as `OrderListWithAcceptedSerializer`). */
export const OrderSchema = v.object({
  ...OrderBaseSchema.entries,
  ...workorderUrlEntries,
  ...assignmentEntries,
  ...nestedEntries,
  ...moneyEntries,
  ...statusEntries,
  created: timestamp(),
  modified: timestamp(),
  customer_relation: fk(),
  required_users: int(1),
  customer_order_accepted: bool(true),
  branch: fk(),
  quotation: fk(),
  last_update: nullableStr(),
  order_email_extra: orderEmailExtra,
})

/** `OrderDispatchSerializer` - no money totals, no `modified`, adds availability. */
export const OrderDispatchSchema = v.object({
  ...OrderBaseSchema.entries,
  ...workorderUrlEntries,
  ...assignmentEntries,
  ...nestedEntries,
  ...statusEntries,
  created: timestamp(),
  user_order_is_available: bool(true),
  required_users: int(1),
  customer_relation: fk(),
  branch: fk(),
  last_update: nullableStr(),
})

/** `OrderDetailSerializer` - everything in OrderSerializer plus the org-order extras. */
export const OrderDetailSchema = v.object({
  ...OrderSchema.entries,
  planning_remarks: nullableStr(''),
  workorder_url_org_order: nullableStr(''),
  workorder_documents_partners: v.optional(v.array(WorkorderDocumentSchema), () => []),
  workorder_documents_org_order: v.optional(v.array(WorkorderDocumentSchema), () => []),
  invoices: v.optional(
    v.array(
      v.object({
        id: fk(),
        invoice_id: nullableStr(''),
        uuid: nullableStr(),
        preliminary: bool(),
      }),
    ),
    () => [],
  ),
  copied_order_data: view(),
  parent_order_data: view(),
})

/** `OrderCustomerHistorySerializer` - a deliberately narrow projection. */
export const OrderCustomerHistorySchema = v.object({
  ...statusEntries,
  id: fk(),
  order_id: nullableStr(''),
  order_date: nullableStr(''),
  order_type: nullableStr(null),
  order_reference: nullableStr(''),
  workorder_pdf_url: nullableStr(''),
  workorder_pdf_url_partner: nullableStr(''),
  orderlines: v.optional(v.array(v.record(v.string(), v.unknown())), () => []),
  quotation: fk(),
  last_update: nullableStr(),
})

export type Order = v.InferOutput<typeof OrderSchema>
export type OrderDispatch = v.InferOutput<typeof OrderDispatchSchema>
export type OrderDetail = v.InferOutput<typeof OrderDetailSchema>
export type OrderCustomerHistory = v.InferOutput<typeof OrderCustomerHistorySchema>

// ─────────────────────────────────────────────────────────────────────────────
// Write schema
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a Date as the `YYYY-MM-DD` the backend DateFields expect.
 *
 * Deliberately uses the local-time getters rather than `toISOString()`, which
 * converts to UTC first and so reports the previous day for any local time
 * before the UTC offset - the exact off-by-one-day bug this app would hit every
 * evening in CET.
 */
export function toApiDate(value: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

/**
 * A date the form may hold as a `Date` but the API must receive as a string.
 *
 * This is the one place in the codebase where `v.InferInput` and
 * `v.InferOutput` genuinely differ: input accepts `string | Date`, output is
 * always the `YYYY-MM-DD` string.
 */
const apiDate = () =>
  v.pipe(
    v.union([v.string(), v.date()]),
    v.transform((value) => (typeof value === 'string' ? value : toApiDate(value))),
  )

/**
 * `ORDER_CREATE_CORE_FIELDS` minus the fields DRF treats as read-only:
 * `id`, `order_id` (extra_kwargs read_only, assigned by OrderCreateMixin) and
 * `order_date` (a SerializerMethodField).
 */
const writeCoreEntries = {
  customer_id: nullableStr(''),
  customer_reference: nullableStr(''),
  ...referenceEntries,
  start_date: apiDate(),
  start_time: nullableStr(null),
  end_date: apiDate(),
  end_time: nullableStr(null),
  remarks: nullableStr(''),
  external_identifier: nullableStr(),
  ...addressEntries,
}

/** `OrderCreateSerializer`. */
export const OrderCreateSchema = v.object({
  ...writeCoreEntries,
  branch: fk(),
  customer_relation: fk(),
  quotation: fk(),
  order_email_extra: orderEmailExtra,
  planning_remarks: nullableStr(''),
})

/** `OrderUpdateSerializer` - same core, without `quotation` and `branch`. */
export const OrderUpdateSchema = v.object({
  ...writeCoreEntries,
  customer_relation: fk(),
  order_email_extra: orderEmailExtra,
  planning_remarks: nullableStr(''),
})

export type OrderCreateInput = v.InferInput<typeof OrderCreateSchema>
export type OrderCreate = v.InferOutput<typeof OrderCreateSchema>
export type OrderUpdateInput = v.InferInput<typeof OrderUpdateSchema>
export type OrderUpdate = v.InferOutput<typeof OrderUpdateSchema>

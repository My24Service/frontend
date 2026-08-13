import * as v from 'valibot'
import {
  vOrder,
  vOrderCreate,
  vOrderCustomerHistory,
  vOrderDetail,
  vOrderDispatch,
  vOrderUpdate,
} from '@/api/valibot.gen'
import { int, withDefaults, writeSchema } from '../schema'

/**
 * Valibot schemas for the Order endpoints, generated from the OpenAPI schema.
 * Each schema is built from its generated counterpart in
 * `src/api/valibot.gen.ts` rather than from a shared hand-written field
 * tuple: unlike the backend serializers, the generated components do not
 * share structure with each other (`vOrder`, `vOrderDispatch`,
 * `vOrderDetail`, ... each repeat their common fields in full), and this file
 * follows that rather than re-deriving the backend's ORDER_BASE_FIELDS /
 * ORDER_ADDRESS_FIELDS / ... composition by hand. Regenerate the source with
 * `npm run codegen`.
 *
 * Which serializer answers which call:
 *
 *   queryMode 'all' / all_for_customer_web   -> OrderSerializer            (vOrder)
 *   queryMode 'dispatch'|'inprogress'|
 *     'finished' / get_within_range          -> OrderDispatchSerializer    (vOrderDispatch)
 *   all_for_equipment_location               -> OrderListWithAcceptedSerializer
 *                                               (alias of OrderSerializer, vOrder)
 *   detail / detailUuid                      -> OrderDetailSerializer      (vOrderDetail)
 *   getAllForCustomer (history)              -> OrderCustomerHistorySerializer
 *                                               (vOrderCustomerHistory)
 *
 * The backend `SerializerMethodField`s are now annotated (see
 * apps/order/serializers/mixins.py, order.py), so the generated components
 * (`vOrderStatus`, `vAssignedUserInfo`, `vWorkorderDocument`,
 * `vReportedCodeExtraData`, `vInvoiceInfo`, `vMaterialItem`, ...) carry the
 * real nested shapes and this file no longer needs to hand-correct them.
 * `baseReadOverrides` below now covers exactly one remaining codegen
 * artifact (`required_users`); everything else in these schemas is untouched
 * generated output plus form defaults.
 */

/**
 * Override shared by `OrderSchema`, `OrderDispatchSchema` and
 * `OrderDetailSchema`.
 */
const baseReadOverrides = {
  /**
   * `required_users` is a plain `PositiveIntegerField` with no explicit
   * max/format, so drf-spectacular (via openapi-ts) falls back to advertising
   * it as an unbounded 64-bit integer, which the valibot generator renders as
   * a `bigint`-coercing union. The real values are small counts of engineers
   * required on an order, never outside safe-integer range - a plain number
   * matches both the model column and every existing caller. Backend gap:
   * bound the field (e.g. `max_value=...`) so the schema stops overshooting.
   */
  required_users: int(1),
}

// ─────────────────────────────────────────────────────────────────────────────
// Read schemas
// ─────────────────────────────────────────────────────────────────────────────

/** `OrderSerializer` (aliased as `OrderListWithAcceptedSerializer`). */
export const OrderSchema = withDefaults(
  v.object({
    ...vOrder.entries,
    ...baseReadOverrides,
  }),
  {
    // Non-nullable generated fields DRF still renders as null (pk, money
    // totals, timestamps, the last-status trio): a `null` default also makes
    // them accept null. Nullable columns that should start `null` (order_type,
    // times, FKs, ...) are inferred by `withDefaults` and so are not listed.
    id: null,
    uuid: null,
    created: null,
    modified: null,
    total_price_purchase: null,
    total_price_selling: null,
    last_update: null,
    last_status: null,
    // semantic non-type defaults.
    order_country_code: 'NL',
    customer_rate_avg: '-',
    required_assigned: '-',
    required_users: 1,
    customer_order_accepted: true,
  },
)

/** `OrderDispatchSerializer` - no money totals, no `modified`, adds availability. */
export const OrderDispatchSchema = withDefaults(
  v.object({
    ...vOrderDispatch.entries,
    ...baseReadOverrides,
  }),
  {
    id: null,
    uuid: null,
    created: null,
    last_update: null,
    last_status: null,
    order_country_code: 'NL',
    user_order_is_available: true,
    required_assigned: '-',
    required_users: 1,
    customer_rate_avg: '-',
  },
)

/** `OrderDetailSerializer` - everything in OrderSerializer plus the org-order extras. */
export const OrderDetailSchema = withDefaults(
  v.object({
    ...vOrderDetail.entries,
    ...baseReadOverrides,
  }),
  {
    id: null,
    uuid: null,
    created: null,
    modified: null,
    total_price_purchase: null,
    total_price_selling: null,
    last_update: null,
    last_status: null,
    /**
     * `Order.get_workorder_url_org_order` genuinely returns `None` (no org
     * order to link to) - the common case. The generated `vWorkorderUrlOrgOrder`
     * usage is not marked nullable even though the OpenAPI schema shows no
     * `nullable: true` on this field either (backend gap: annotate
     * `get_workorder_url_org_order` so drf-spectacular knows it can be null).
     * `null` here makes `withDefaults` wrap the entry in `v.nullable(...)`.
     */
    workorder_url_org_order: null,
    order_country_code: 'NL',
    customer_rate_avg: '-',
    required_assigned: '-',
    required_users: 1,
    customer_order_accepted: true,
  },
)

/** `OrderCustomerHistorySerializer` - a deliberately narrow projection. */
export const OrderCustomerHistorySchema = withDefaults(vOrderCustomerHistory, {
  id: null,
  last_update: null,
  last_status: null,
})

export type Order = v.InferOutput<typeof OrderSchema>
export type OrderDispatch = v.InferOutput<typeof OrderDispatchSchema>
export type OrderDetail = v.InferOutput<typeof OrderDetailSchema>
export type OrderCustomerHistory = v.InferOutput<typeof OrderCustomerHistorySchema>

// ─────────────────────────────────────────────────────────────────────────────
// Write schemas
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
 * always the `YYYY-MM-DD` string. Overrides the generated `isoDate` string
 * entry, which has no notion of accepting a `Date`.
 */
const apiDate = () =>
  v.pipe(
    v.union([v.string(), v.date()]),
    v.transform((value) => (typeof value === 'string' ? value : toApiDate(value))),
  )

/** Read-only fields present in `Meta.fields` but never accepted on write. */
const READ_ONLY_ORDER_KEYS = ['id', 'order_id', 'order_date', 'last_status', 'last_status_full', 'last_status_date'] as const

/** `OrderCreateSerializer`. */
export const OrderCreateSchema = writeSchema(
  withDefaults(
    v.object({
      ...vOrderCreate.entries,
      start_date: apiDate(),
      end_date: apiDate(),
    }),
    {
      // `order_type` is non-nullable in the generated create schema, but DRF
      // sends null for a new order's not-yet-chosen type; `null` widens it.
      // Nullable selections (start_time, end_time, branch, customer_relation,
      // quotation, external_identifier) start `null` and are inferred. Nullable
      // strings that are form text inputs bind to `''`.
      order_type: null,
      order_country_code: 'NL',
    },
  ),
  READ_ONLY_ORDER_KEYS,
)

/** `OrderUpdateSerializer` - same core, without `quotation` and `branch`. */
export const OrderUpdateSchema = writeSchema(
  withDefaults(
    v.object({
      ...vOrderUpdate.entries,
      start_date: apiDate(),
      end_date: apiDate(),
    }),
    {
      order_type: null,
      order_country_code: 'NL',
    },
  ),
  READ_ONLY_ORDER_KEYS,
)

export type OrderCreateInput = v.InferInput<typeof OrderCreateSchema>
export type OrderCreate = v.InferOutput<typeof OrderCreateSchema>
export type OrderUpdateInput = v.InferInput<typeof OrderUpdateSchema>
export type OrderUpdate = v.InferOutput<typeof OrderUpdateSchema>

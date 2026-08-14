import * as v from 'valibot'
import {
  vBranchOwnerRequired,
  vCustomerRelationOwnerRequired,
  vOrder,
  vOrderCreateWritable,
  vOrderCustomerHistory,
  vOrderDetail,
  vOrderDispatch,
  vOrderUpdateWritable,
} from '@/api/valibot.gen'
import { int, lenient, widenNullable } from '../schema'

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
 * The backend `SerializerMethodField`s are annotated (apps/order/serializers/
 * mixins.py, order.py), so the generated components carry the real nested
 * shapes and nothing here hand-corrects them. `baseReadOverrides` covers a
 * single codegen artifact (`required_users`); everything else is untouched
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
export const OrderSchema = lenient(
  v.object({
    ...vOrder.entries,
    ...baseReadOverrides,
  }),
)

/** `OrderDispatchSerializer` - no money totals, no `modified`, adds availability. */
export const OrderDispatchSchema = lenient(
  v.object({
    ...vOrderDispatch.entries,
    ...baseReadOverrides,
  }),
)

/** `OrderDetailSerializer` - everything in OrderSerializer plus the org-order extras. */
export const OrderDetailSchema = lenient(
  widenNullable(
    v.object({
      ...vOrderDetail.entries,
      ...baseReadOverrides,
    }),
    // Backend gap, not a form concern: `Order.get_workorder_url_org_order`
    // (models/mixins/workorder_pdf.py) returns None in the common case - there
    // is no org order to link to - but nothing annotates it, so drf-spectacular
    // emits a non-nullable string and real responses carry a null the generated
    // schema would reject. Fix belongs in the serializer; delete this when it
    // lands.
    ['workorder_url_org_order'],
  ),
)
// Order matters: `v.nullable` requires the key to be present, so widening has
// to happen before `lenient` makes every entry optional. The other way round
// silently un-optionals the widened field.

/** `OrderCustomerHistorySerializer` - a deliberately narrow projection. */
export const OrderCustomerHistorySchema = lenient(vOrderCustomerHistory)

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

/**
 * The read/write split is not maintained here - the generator already knows it.
 *
 * DRF declares these fields `read_only=True`, drf-spectacular emits them as
 * `readOnly: true`, and hey-api turns that into a second component per
 * serializer: `vOrderCreate` is the response body, `vOrderCreateWritable` the
 * request body, identical but for the read-only fields (`id`, `order_id`,
 * `order_date` and the `last_status` trio). Building the write schema from the
 * `Writable` variant means a field that becomes writable - or stops being -
 * arrives with the next codegen run instead of having to be noticed here.
 */

/**
 * Shared base for the order create serializers.
 *
 * `start_date`/`end_date` are overridden with `apiDate()` because the API
 * accepts either a Date or an API date string.
 */
export const OrderCreateSchema = v.object({
  ...vOrderCreateWritable.entries,
  start_date: apiDate(),
  end_date: apiDate(),
})

/** `OrderCreateBranchSerializer` - planning variant for tenants with branches (`branch` mandatory). */
export const OrderCreateBranchSchema = v.intersect([
  OrderCreateSchema,
  vBranchOwnerRequired,
])

/** `OrderCreateCustomerRelationSerializer` - planning variant for tenants without branches (`customer_relation` mandatory). */
export const OrderCreateCustomerRelationSchema = v.intersect([
  OrderCreateSchema,
  vCustomerRelationOwnerRequired,
])

/**
 * `OrderCreate` schema for a tenant's planning variant.
 *
 * `OrderCreateBranchSerializer` requires `branch` when the member has
 * branches and `OrderCreateCustomerRelationSerializer` requires `customer_relation`
 * when it does not. Both compose `OrderCreateSchema` with their required owner
 * fragment (`vBranchOwnerRequired` / `vCustomerRelationOwnerRequired`).
 *
 * Pass `mainStore.getHasBranches`.
 */
export const orderCreateSchemaFor = (hasBranches: boolean) =>
  hasBranches ? OrderCreateBranchSchema : OrderCreateCustomerRelationSchema

/** `OrderUpdateSerializer` - same core, without `quotation` and `branch`. */
export const OrderUpdateSchema =   v.object({
    ...vOrderUpdateWritable.entries,
    start_date: apiDate(),
    end_date: apiDate(),
  })

export type OrderCreateInput = v.InferInput<typeof OrderCreateSchema>
export type OrderCreate = v.InferOutput<typeof OrderCreateSchema>
export type OrderUpdateInput = v.InferInput<typeof OrderUpdateSchema>
export type OrderUpdate = v.InferOutput<typeof OrderUpdateSchema>

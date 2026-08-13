import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import orderService, { OrderModel, OrderFormSchema, nextWorkingDay } from '@/models/orders/Order'
import {
  OrderSchema,
  OrderDispatchSchema,
  OrderDetailSchema,
  OrderCustomerHistorySchema,
  OrderCreateSchema,
  OrderUpdateSchema,
} from '@/models/orders/order-schemas'

/**
 * The schemas are the contract with the DRF serializers, and almost all of that
 * contract lives in default values and nullability rather than in executable
 * code. These tests pin the defaults and the field sets. They are deliberately
 * explicit rather than derived from the schema, so a schema edit that changes
 * the wire contract has to be acknowledged here.
 *
 * A note on mutation testing this file: `ignoreStatic` must be off, or the
 * numbers are meaningless. Every schema here is a module-level constant, which
 * makes each of its mutants a "static" mutant. With `ignoreStatic: true`
 * Stryker reports this file at 4.9% with 77 survivors; with it off, the same
 * tests score 72.8% with 59 killed. The mutants are not reachable per-test
 * unless Stryker is allowed to re-evaluate the module with the mutant active.
 */

/** The complete set of keys the order forms bind to. */
const FORM_KEYS = [
  'branch',
  'customer_id',
  'customer_reference',
  'customer_relation',
  'customer_remarks',
  'description',
  'end_date',
  'end_time',
  'external_identifier',
  'infolines',
  'order_address',
  'order_city',
  'order_contact',
  'order_country_code',
  'order_email',
  'order_email_extra',
  'order_mobile',
  'order_name',
  'order_postal',
  'order_reference',
  'order_tel',
  'order_type',
  'orderlines',
  'planning_remarks',
  'quotation',
  'remarks',
  'reported_codes_extra_data',
  'required_users',
  'service_number',
  'start_date',
  'start_time',
  'statuses',
  'workorder_documents',
  'workorder_pdf_url',
  'workorder_pdf_url_partner',
]

describe('OrderFormSchema', () => {
  test('has exactly the expected field set', () => {
    expect(Object.keys(OrderFormSchema.entries).sort()).toEqual([...FORM_KEYS].sort())
  })

  test('getFields returns exactly that field set', () => {
    expect(Object.keys(orderService.getFields()).sort()).toEqual([...FORM_KEYS].sort())
  })

  test('the client-only groups are present and not silently dropped', () => {
    const keys = Object.keys(OrderFormSchema.entries)
    // discardedByBackendEntries
    expect(keys).toContain('service_number')
    expect(keys).toContain('required_users')
    // formOnlyEntries
    expect(keys).toContain('statuses')
    expect(keys).toContain('orderlines')
    expect(keys).toContain('infolines')
    expect(keys).toContain('workorder_documents')
    expect(keys).toContain('reported_codes_extra_data')
    expect(keys).toContain('workorder_pdf_url')
    expect(keys).toContain('workorder_pdf_url_partner')
  })

  test('every collection default is an empty array', () => {
    // Read straight off the schema rather than via getFields(), which
    // JSON-clones and would hide an `undefined` default by dropping the key.
    const defaults = v.getDefaults(OrderFormSchema)
    for (const key of [
      'statuses',
      'orderlines',
      'infolines',
      'workorder_documents',
      'reported_codes_extra_data',
      'order_email_extra',
    ]) {
      expect(defaults[key], `${key} default`).toEqual([])
    }
  })

  test('collection defaults are fresh objects, not one shared array', () => {
    const a = v.getDefaults(OrderFormSchema)
    const b = v.getDefaults(OrderFormSchema)
    a.orderlines.push({ id: 1 })
    expect(b.orderlines).toEqual([])
  })

  test('the scalar defaults are pinned', () => {
    const defaults = v.getDefaults(OrderFormSchema)

    expect(defaults.order_country_code).toBe('NL')
    expect(defaults.workorder_pdf_url).toBe('')
    expect(defaults.workorder_pdf_url_partner).toBe('')
    expect(defaults.service_number).toBe('')
    expect(defaults.required_users).toBe(1)
    expect(defaults.customer_id).toBe('')
    expect(defaults.order_name).toBe('')
    expect(defaults.description).toBe('')
    expect(defaults.order_type).toBeNull()
    expect(defaults.branch).toBeNull()
    expect(defaults.customer_relation).toBeNull()
    expect(defaults.quotation).toBeNull()
    expect(defaults.start_time).toBeNull()
    expect(defaults.end_time).toBeNull()
  })

  test('start_date and end_date default to the next working day', () => {
    // Read through OrderModel, which does not go through postCopyFields and so
    // exposes the schema default rather than the re-stamped one.
    const order = new OrderModel()
    const expected = nextWorkingDay()

    expect(order.start_date).toBeInstanceOf(Date)
    expect(order.end_date).toBeInstanceOf(Date)
    expect(order.start_date.toDateString()).toBe(expected.toDateString())
    expect(order.end_date.toDateString()).toBe(expected.toDateString())
  })
})

// `OrderBaseSchema` and its shared ORDER_*_FIELDS groups are gone: the
// generated components (`vOrder`, `vOrderDispatch`, `vOrderDetail`, ...) do
// not share structure with each other the way the backend's serializer field
// tuples do, and order-schemas.ts now builds each schema from its own
// generated counterpart rather than re-deriving a hand-written shared base.
// The field-set and default coverage that block used to provide is still
// exercised per-schema below (`OrderSchema`, `OrderCustomerHistorySchema`,
// the write schemas, ...).

describe('read schema defaults', () => {
  test('OrderSchema computed fields default to their empty cases', () => {
    const parsed = v.parse(OrderSchema, {})

    expect(parsed.required_assigned).toBe('-')
    expect(parsed.customer_rate_avg).toBe('-')
    expect(parsed.assigned_count).toBe(0)
    expect(parsed.user_order_available_set_count).toBe(0)
    expect(parsed.assigned_user_info).toEqual([])
    expect(parsed.materials).toEqual([])
    // `reported_codes_extra_data` is NOT part of OrderSerializer.Meta.fields
    // (apps/order/serializers/order.py) - only OrderDetailSerializer declares
    // it. The old hand-written schema shared it across both via a common
    // "assignment entries" group; the generated `vOrder` correctly omits it.
    expect(parsed.documents).toEqual([])
    expect(parsed.statuses).toEqual([])
    expect(parsed.workorder_documents).toEqual([])
  })

  test('OrderSchema scalar defaults are pinned', () => {
    const parsed = v.parse(OrderSchema, {})

    expect(parsed.customer_order_accepted).toBe(true)
    expect(parsed.required_users).toBe(1)
    expect(parsed.order_email_extra).toEqual([])
    expect(parsed.total_price_purchase).toBeNull()
    expect(parsed.total_price_selling).toBeNull()
    expect(parsed.created).toBeNull()
    expect(parsed.modified).toBeNull()
    expect(parsed.last_status).toBeNull()
    expect(parsed.workorder_url).toBe('')
  })

  test('OrderDispatchSchema defaults user_order_is_available to true', () => {
    expect(v.parse(OrderDispatchSchema, {}).user_order_is_available).toBe(true)
  })

  test('OrderDispatchSchema omits what OrderSerializer adds', () => {
    const keys = Object.keys(OrderDispatchSchema.entries)
    expect(keys).not.toContain('modified')
    expect(keys).not.toContain('total_price_selling')
    expect(keys).not.toContain('customer_order_accepted')
    expect(keys).not.toContain('quotation')
    expect(keys).not.toContain('order_email_extra')
  })

  test('OrderDetailSchema is OrderSchema plus the org-order extras, minus quotation/materials', () => {
    // OrderDetailSerializer.Meta.fields (apps/order/serializers/order.py) does
    // NOT include `quotation` or `materials` - both are OrderSerializer-only.
    // The old hand-written schema built OrderDetailSchema by spreading
    // `...OrderSchema.entries`, which carried both fields over incorrectly;
    // the generated `vOrderDetail` correctly omits them.
    const detail = Object.keys(OrderDetailSchema.entries)
    for (const key of Object.keys(OrderSchema.entries)) {
      if (key === 'quotation' || key === 'materials') continue
      expect(detail, `detail should contain ${key}`).toContain(key)
    }
    expect(detail).not.toContain('quotation')
    expect(detail).not.toContain('materials')
    for (const key of [
      'planning_remarks',
      'workorder_url_org_order',
      'workorder_documents_partners',
      'workorder_documents_org_order',
      'invoices',
      'copied_order_data',
      'parent_order_data',
    ]) {
      expect(detail).toContain(key)
    }
  })

  test('OrderDetailSchema nested defaults are empty', () => {
    const parsed = v.parse(OrderDetailSchema, {})
    expect(parsed.invoices).toEqual([])
    expect(parsed.workorder_documents_partners).toEqual([])
    expect(parsed.workorder_documents_org_order).toEqual([])
    // `copied_order_data` is a list (Order.get_copied_order_data returns a
    // list), while `parent_order_data` is a single dict that can be `{}`.
    expect(parsed.copied_order_data).toEqual([])
    expect(parsed.parent_order_data).toEqual({})
  })

  test('OrderCustomerHistorySchema has exactly its narrow field set', () => {
    expect(Object.keys(OrderCustomerHistorySchema.entries).sort()).toEqual(
      [
        'id', 'order_id', 'order_date', 'order_type', 'order_reference',
        'workorder_pdf_url', 'workorder_pdf_url_partner', 'orderlines',
        'quotation', 'last_update',
        'last_status', 'last_status_full', 'last_status_date',
      ].sort(),
    )
  })

  test('the workorder url defaults are pinned', () => {
    const parsed = v.parse(OrderSchema, {})
    expect(parsed.workorder_pdf_url).toBe('')
    // `workorder_pdf_url_partner` is an array of workorder documents (partner
    // copies), not a single URL.
    expect(parsed.workorder_pdf_url_partner).toEqual([])
  })

  test('nested workorder documents require both url and name', () => {
    const parsed = v.parse(OrderSchema, {
      workorder_documents: [{ url: '/media/a.pdf', name: 'a.pdf' }],
    })
    expect(parsed.workorder_documents[0]).toEqual({ url: '/media/a.pdf', name: 'a.pdf' })
    // `vWorkorderDocument` declares `url` and `name` as required, matching
    // get_workorder_documents which always emits both keys.
    expect(() => v.parse(OrderSchema, { workorder_documents: [{}] })).toThrow()
  })

  test('nested status rows require the full field set', () => {
    // `vOrderStatus` mirrors OrderStatusSerializer.Meta.fields
    // ('id','order','status','modified','created') - all required. A bare `{}`
    // row has no defaults to fall back on.
    expect(() => v.parse(OrderSchema, { statuses: [{}] })).toThrow()
  })

  test('assigned_user_info requires user_id, full_name and license_plate', () => {
    // get_assigned_user_info always emits all three keys, so the generated
    // `vAssignedUserInfo` marks them required rather than optional.
    expect(() => v.parse(OrderSchema, { assigned_user_info: [{}] })).toThrow()
  })

  test('reported_codes_extra_data rows require their statuscode', () => {
    // `reported_codes_extra_data` only exists on OrderDetailSerializer, not
    // OrderSerializer - see the note above OrderSchema's computed-fields test.
    // get_reported_codes_extra_data always emits `statuscode`, so the
    // generated `vReportedCodeExtraData` requires it.
    const parsed = v.parse(OrderDetailSchema, {
      reported_codes_extra_data: [{ statuscode: 'FOO', extra_data: { a: 1 } }],
    })
    expect(parsed.reported_codes_extra_data[0].statuscode).toBe('FOO')
    expect(parsed.reported_codes_extra_data[0].extra_data).toEqual({ a: 1 })
    expect(() =>
      v.parse(OrderDetailSchema, { reported_codes_extra_data: [{ extra_data: { a: 1 } }] }),
    ).toThrow()
  })

  test('orderlines and infolines default to empty arrays', () => {
    const parsed = v.parse(OrderSchema, {})
    expect(parsed.orderlines).toEqual([])
    expect(parsed.infolines).toEqual([])
  })

  test('OrderDetailSchema string defaults are pinned', () => {
    const parsed = v.parse(OrderDetailSchema, {})
    expect(parsed.planning_remarks).toBe('')
    // `get_workorder_url_org_order` returns None in the common case (no org
    // order), so the schema defaults it to null.
    expect(parsed.workorder_url_org_order).toBeNull()
  })

  test('OrderDetailSchema invoice rows require id, invoice_id, uuid and preliminary', () => {
    // get_invoices always emits all four keys, so `vInvoiceInfo` marks them
    // required - a bare `{}` row has no defaults.
    const parsed = v.parse(OrderDetailSchema, {
      invoices: [{ id: 1, invoice_id: 'INV-1', uuid: 'abc-123', preliminary: false }],
    })
    expect(parsed.invoices[0]).toEqual({
      id: 1,
      invoice_id: 'INV-1',
      uuid: 'abc-123',
      preliminary: false,
    })
    expect(() => v.parse(OrderDetailSchema, { invoices: [{}] })).toThrow()
  })

  test('OrderCustomerHistorySchema defaults are pinned', () => {
    expect(v.parse(OrderCustomerHistorySchema, {})).toEqual({
      id: null,
      order_id: '',
      order_date: '',
      order_type: null,
      order_reference: '',
      workorder_pdf_url: '',
      workorder_pdf_url_partner: [],
      orderlines: [],
      quotation: null,
      last_update: null,
      last_status: null,
      last_status_full: null,
      last_status_date: null,
    })
  })

  test('nested status rows parse', () => {
    const parsed = v.parse(OrderSchema, {
      statuses: [
        { id: 1, order: 2, status: 'created', modified: '08-01-2026 10:00', created: '08-01-2026 10:00' },
      ],
    })
    expect(parsed.statuses[0]).toEqual({
      id: 1,
      order: 2,
      status: 'created',
      modified: '08-01-2026 10:00',
      created: '08-01-2026 10:00',
    })
  })

  test('assigned_user_info accepts the extended booked variant', () => {
    const parsed = v.parse(OrderDetailSchema, {
      assigned_user_info: [{ user_id: 1, full_name: 'A B', license_plate: null, booked: 3 }],
    })
    expect(parsed.assigned_user_info[0].booked).toBe(3)
  })

  test('a non-array order_email_extra is rejected', () => {
    // The old form default was the string '' - the schema must not accept it.
    expect(() => v.parse(OrderSchema, { order_email_extra: '' })).toThrow()
  })
})

describe('write schemas', () => {
  test('OrderCreateSchema has exactly its expected field set', () => {
    expect(Object.keys(OrderCreateSchema.entries).sort()).toEqual(
      [
        'customer_id', 'customer_reference',
        'order_reference', 'order_type', 'customer_remarks', 'description',
        'start_date', 'start_time', 'end_date', 'end_time', 'remarks',
        'external_identifier',
        'order_name', 'order_address', 'order_postal', 'order_city', 'order_country_code',
        'order_tel', 'order_mobile', 'order_email', 'order_contact',
        'branch', 'customer_relation', 'quotation', 'order_email_extra', 'planning_remarks',
      ].sort(),
    )
  })

  test('OrderUpdateSchema is OrderCreateSchema without branch and quotation', () => {
    const create = new Set(Object.keys(OrderCreateSchema.entries))
    const update = new Set(Object.keys(OrderUpdateSchema.entries))

    expect(update.has('branch')).toBe(false)
    expect(update.has('quotation')).toBe(false)
    for (const key of update) {
      expect(create.has(key), `create should also have ${key}`).toBe(true)
    }
  })

  test('both accept a Date and emit the api string', () => {
    for (const schema of [OrderCreateSchema, OrderUpdateSchema]) {
      const parsed = v.parse(schema, {
        start_date: new Date(2026, 0, 8),
        end_date: new Date(2026, 11, 31),
      })
      expect(parsed.start_date).toBe('2026-01-08')
      expect(parsed.end_date).toBe('2026-12-31')
    }
  })

  test('a date that is neither string nor Date is rejected', () => {
    expect(() => v.parse(OrderCreateSchema, { start_date: 20260108 })).toThrow()
  })

  test('order_country_code still defaults to NL on write', () => {
    expect(v.getDefaults(OrderCreateSchema).order_country_code).toBe('NL')
  })

  test('the write-core string defaults are pinned', () => {
    const defaults = v.getDefaults(OrderCreateSchema)
    expect(defaults.customer_reference).toBe('')
    expect(defaults.remarks).toBe('')
    expect(defaults.planning_remarks).toBe('')
    expect(defaults.external_identifier).toBeNull()
  })

  test('OrderUpdateSchema shares those defaults', () => {
    const defaults = v.getDefaults(OrderUpdateSchema)
    expect(defaults.customer_reference).toBe('')
    expect(defaults.remarks).toBe('')
    expect(defaults.planning_remarks).toBe('')
  })
})

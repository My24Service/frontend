import { describe, expect, test } from 'vitest'
import * as v from 'valibot'

import orderService, { OrderModel, OrderFormSchema, nextWorkingDay } from '@/models/orders/Order'
import {
  OrderSchema,
  OrderDispatchSchema,
  OrderDetailSchema,
  OrderCustomerHistorySchema,
  OrderBaseSchema,
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

describe('OrderBaseSchema', () => {
  test('mirrors the backend ORDER_BASE_FIELDS tuple', () => {
    expect(Object.keys(OrderBaseSchema.entries).sort()).toEqual(
      [
        // ORDER_ID_FIELDS
        'id', 'uuid', 'customer_id', 'order_id', 'customer_reference',
        // ORDER_REFERENCE_FIELDS
        'order_reference', 'order_type', 'customer_remarks', 'description',
        // ORDER_TIME_FIELDS
        'start_date', 'start_time', 'end_date', 'end_time', 'order_date', 'remarks',
        // ORDER_ADDRESS_FIELDS
        'order_name', 'order_address', 'order_postal', 'order_city', 'order_country_code',
        'order_tel', 'order_mobile', 'order_email', 'order_contact',
      ].sort(),
    )
  })

  test('order_country_code defaults to NL', () => {
    expect(v.getDefaults(OrderBaseSchema).order_country_code).toBe('NL')
  })

  test('every base default is pinned', () => {
    // These come from the four backend field tuples. Asserting them here is the
    // only thing standing between a mistyped default and a form that quietly
    // posts the wrong value - mutation testing cannot help, see the note at the
    // top of this file.
    expect(v.getDefaults(OrderBaseSchema)).toEqual({
      // ORDER_ID_FIELDS
      id: null,
      uuid: null,
      customer_id: '',
      order_id: '',
      customer_reference: '',
      // ORDER_REFERENCE_FIELDS
      order_reference: '',
      order_type: null,
      customer_remarks: '',
      description: '',
      // ORDER_TIME_FIELDS
      start_date: '',
      start_time: null,
      end_date: '',
      end_time: null,
      order_date: '',
      remarks: '',
      // ORDER_ADDRESS_FIELDS
      order_name: '',
      order_address: '',
      order_postal: '',
      order_city: '',
      order_country_code: 'NL',
      order_tel: '',
      order_mobile: '',
      order_email: '',
      order_contact: '',
    })
  })

  test('nullable fields accept null from the API', () => {
    const parsed = v.parse(OrderBaseSchema, {
      customer_id: null,
      order_id: null,
      customer_reference: null,
      order_reference: null,
      order_type: null,
      customer_remarks: null,
      description: null,
      remarks: null,
      order_address: null,
    })
    expect(parsed.customer_id).toBeNull()
    expect(parsed.description).toBeNull()
  })

  test('start_date and end_date are plain strings on read, not Dates', () => {
    // The Date handling belongs to the write schemas only.
    const parsed = v.parse(OrderBaseSchema, { start_date: '2026-01-08', end_date: '2026-01-09' })
    expect(parsed.start_date).toBe('2026-01-08')
    expect(() => v.parse(OrderBaseSchema, { start_date: new Date() })).toThrow()
  })
})

describe('read schema defaults', () => {
  test('OrderSchema computed fields default to their empty cases', () => {
    const parsed = v.parse(OrderSchema, {})

    expect(parsed.required_assigned).toBe('-')
    expect(parsed.customer_rate_avg).toBe('-')
    expect(parsed.assigned_count).toBe(0)
    expect(parsed.user_order_available_set_count).toBe(0)
    expect(parsed.assigned_user_info).toEqual([])
    expect(parsed.materials).toEqual([])
    expect(parsed.reported_codes_extra_data).toEqual([])
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

  test('OrderDetailSchema is OrderSchema plus the org-order extras', () => {
    const detail = Object.keys(OrderDetailSchema.entries)
    for (const key of Object.keys(OrderSchema.entries)) {
      expect(detail, `detail should contain ${key}`).toContain(key)
    }
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
    expect(parsed.copied_order_data).toEqual({})
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
    expect(parsed.workorder_pdf_url_partner).toBe('')
  })

  test('nested workorder documents require both url and name', () => {
    const parsed = v.parse(OrderSchema, {
      workorder_documents: [{ url: '/media/a.pdf', name: 'a.pdf' }],
    })
    expect(parsed.workorder_documents[0]).toEqual({ url: '/media/a.pdf', name: 'a.pdf' })
    expect(v.parse(OrderSchema, { workorder_documents: [{}] }).workorder_documents[0]).toEqual({
      url: '',
      name: '',
    })
  })

  test('nested status rows default their fields', () => {
    const parsed = v.parse(OrderSchema, { statuses: [{}] })
    expect(parsed.statuses[0]).toEqual({ id: null, status: '', created: null })
  })

  test('assigned_user_info defaults its fields', () => {
    const parsed = v.parse(OrderSchema, { assigned_user_info: [{}] })
    expect(parsed.assigned_user_info[0].full_name).toBe('')
    expect(parsed.assigned_user_info[0].user_id).toBeNull()
    expect(parsed.assigned_user_info[0].license_plate).toBeNull()
  })

  test('reported_codes_extra_data rows default their statuscode', () => {
    const parsed = v.parse(OrderSchema, { reported_codes_extra_data: [{ extra_data: { a: 1 } }] })
    expect(parsed.reported_codes_extra_data[0].statuscode).toBe('')
    expect(parsed.reported_codes_extra_data[0].extra_data).toEqual({ a: 1 })
  })

  test('orderlines and infolines default to empty arrays', () => {
    const parsed = v.parse(OrderSchema, {})
    expect(parsed.orderlines).toEqual([])
    expect(parsed.infolines).toEqual([])
  })

  test('OrderDetailSchema string defaults are pinned', () => {
    const parsed = v.parse(OrderDetailSchema, {})
    expect(parsed.planning_remarks).toBe('')
    expect(parsed.workorder_url_org_order).toBe('')
  })

  test('OrderDetailSchema invoice rows default their fields', () => {
    const parsed = v.parse(OrderDetailSchema, { invoices: [{}] })
    expect(parsed.invoices[0]).toEqual({
      id: null,
      invoice_id: '',
      uuid: null,
      preliminary: false,
    })
  })

  test('OrderCustomerHistorySchema defaults are pinned', () => {
    expect(v.parse(OrderCustomerHistorySchema, {})).toEqual({
      id: null,
      order_id: '',
      order_date: '',
      order_type: null,
      order_reference: '',
      workorder_pdf_url: '',
      workorder_pdf_url_partner: '',
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
      statuses: [{ id: 1, status: 'created', created: '08-01-2026 10:00' }],
    })
    expect(parsed.statuses[0]).toEqual({ id: 1, status: 'created', created: '08-01-2026 10:00' })
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

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'

import {
  vMaterial,
  vPurchaseOrderDetail,
  vPurchaseOrderMaterial,
  vSupplier,
  vSupplierReservationAutocomplete,
  vSupplierReservationMaterial,
} from '@/api/valibot.gen'
import { PurchaseOrderForm } from '@/features/inventory'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../support/form-harness.js'
import { serverError } from '../support/list-harness.js'
import {
  SUPPLIER,
  addProduct,
  button,
  datePickerStub,
  deleteStagedRow,
  editStagedRow,
  materialRow,
  multiselectStub,
  picker,
  searchProducts,
  stagedRows,
  supplierRow,
} from '../support/inventory-material-rows.js'

// THE SAVE IS ONE REQUEST.
//
// `POST/PATCH /api/inventory/purchaseorder[/{id}]/with-materials/` takes the
// order and the whole `materials` list in one request, so what this spec pins is
// the traffic a given form state produces - which endpoints, with which bodies -
// plus the two guarantees that come with it: a failed save leaves nothing
// behind, and a retry re-sends the same single request rather than a second
// order. The per-row endpoints are stubbed but never expected to be called: if
// a loop comes back, an assertion on `writes()` names the leaked requests.

const api = installApiSeam()

const ORDERS = '/api/inventory/purchaseorder/with-materials/'
const ORDER = '/api/inventory/purchaseorder/{id}/with-materials/'
const ORDER_DETAIL = '/api/inventory/purchaseorder/{id}/'
const SUPPLIERS = '/api/inventory/supplier/autocomplete/'
const RESERVATIONS = '/api/inventory/supplier-reservation/autocomplete/'
const MATERIALS = '/api/inventory/material/autocomplete/'

const blank = { template: '<div />' }
const routes = [
  { name: 'purchaseorder-list', path: '/inventory/purchaseorders', component: blank },
]

const bodies = () => toasts().map((toast) => toast.body)
const titles = () => toasts().map((toast) => toast.title)

/** Every write the form made, in call order. Reads are noise here. */
function writes() {
  return api.requests().filter((request) => request.method !== 'get')
}

const storedMaterial = (id, material, name, amount, remarks) => fixtureFor(vPurchaseOrderMaterial, {
  id,
  material,
  amount,
  remarks,
  material_view: fixtureFor(vMaterial, { id: material, name }),
})

/**
 * The detail GET, answered the way the backend answers it.
 *
 * The response carries the entry date twice: `expected_entry_date` is the
 * tenant's display string and `expected_entry_date_iso` the machine-readable
 * one (`PurchaseOrderDetailSerializer.get_display_date_fields`). The display
 * string is set to a non-ISO value on purpose - the form must read the twin,
 * not parse that.
 */
function detailResponse(overrides = {}) {
  return fixtureFor(vPurchaseOrderDetail, {
    id: 42,
    supplier: 3,
    purchase_order_id: 'PO-0042',
    order_name: 'ACME',
    order_address: 'Street 1',
    order_postal: '1000AA',
    order_city: 'Amsterdam',
    order_country_code: 'NL',
    order_reference: 'REF-1',
    order_tel: '020',
    order_mobile: '06',
    order_email: 'a@b.nl',
    order_contact: 'Jan',
    supplier_remarks: 'none',
    description: 'first order',
    expected_entry_date: '04/03/2026',
    expected_entry_date_iso: '2026-03-04',
    materials: [
      storedMaterial(7, 10, 'Widget', 3, 'first'),
      storedMaterial(8, 11, 'Gadget', 5, null),
    ],
    ...overrides,
  })
}

function reservationOption(overrides = {}) {
  return fixtureFor(vSupplierReservationAutocomplete, {
    id: 55,
    supplier: fixtureFor(vSupplier, { ...SUPPLIER, identifier: 'SUP-1' }),
    products: [
      // The reservation's own rows: the ids are the reservation material's.
      fixtureFor(vSupplierReservationMaterial, {
        id: 77,
        reservation: 55,
        material: 10,
        amount: 2,
        remarks: 'reserved',
        material_view: fixtureFor(vMaterial, { id: 10, name: 'Widget' }),
      }),
      fixtureFor(vSupplierReservationMaterial, {
        id: 78,
        reservation: 55,
        material: 11,
        amount: 4,
        remarks: null,
        material_view: fixtureFor(vMaterial, { id: 11, name: 'Gadget' }),
      }),
    ],
    ...overrides,
  })
}

beforeEach(() => {
  api.get(SUPPLIERS, () => [supplierRow()])
  api.get(RESERVATIONS, () => [reservationOption()])
  api.get(MATERIALS, () => [materialRow()])
  api.get(ORDER_DETAIL, () => detailResponse())
  // The parent comes back as the backend builds it: the order it stored.
  api.post(ORDERS, ({ body }) => detailResponse({ id: 100, supplier: body.supplier, materials: [] }))
  api.patch(ORDER, ({ body }) => detailResponse({ supplier: body.supplier, materials: [] }))
})

afterEach(() => {
  vi.useRealTimers()
})

function mountOrder(props = {}) {
  return mountForm(PurchaseOrderForm, {
    deep: true,
    routes,
    props,
    stubs: { VueMultiselect: multiselectStub, VueDatePicker: datePickerStub },
  })
}

async function readyToCreate() {
  const wrapper = mountOrder()
  await settle()
  return wrapper
}

async function readyToEdit() {
  const wrapper = mountOrder({ pk: 42 })
  await settle()
  return wrapper
}

const supplierPicker = (wrapper) => picker(wrapper, 'purchaseorder-supplier-search')
const reservationPicker = (wrapper) => picker(wrapper, 'purchaseorder-reservation-search')
const datePicker = (wrapper) => picker(wrapper, 'expected_entry_date')
const submit = (wrapper) => button(wrapper, 'Submit').trigger('click')
const field = (wrapper, id) => wrapper.get(`#purchaseorder_${id}`).element.value

async function pickSupplier(wrapper, row = supplierRow()) {
  supplierPicker(wrapper).vm.$emit('select', row)
  await settle()
}

async function pickDate(wrapper, date = new Date(2026, 2, 4, 12)) {
  datePicker(wrapper).vm.$emit('update:modelValue', date)
  await settle()
}

/** A create form with a supplier and a fixed date. */
async function readyToSave() {
  const wrapper = await readyToCreate()
  await pickSupplier(wrapper)
  await pickDate(wrapper)
  return wrapper
}

/**
 * The body a create sends, whole: the order's own fields as the supplier filled
 * them in, the date, and the materials. `purchase_order_id` is absent - the
 * server assigns it.
 */
function createBody(materials, overrides = {}) {
  return {
    supplier: 3,
    supplier_reservation: null,
    order_name: 'ACME',
    order_address: 'Street 1',
    order_postal: '1000AA',
    order_city: 'Amsterdam',
    order_country_code: 'NL',
    order_reference: '',
    order_tel: '020',
    order_mobile: '06',
    order_email: 'a@b.nl',
    order_contact: 'Jan',
    expected_entry_date: '2026-03-04',
    supplier_remarks: 'none',
    description: '',
    materials,
    ...overrides,
  }
}

describe('PurchaseOrderForm - create', () => {
  test('sends one request carrying the order and its whole product list', async () => {
    const wrapper = await readyToSave()

    await addProduct(wrapper, { id: 10, name: 'Widget' }, 2, 'first')
    await addProduct(wrapper, { id: 11, name: 'Gadget' }, 5, 'second')
    await submit(wrapper)
    await settle()

    expect(writes()).toEqual([
      {
        method: 'post',
        path: ORDERS,
        query: {},
        body: createBody([
          { material: 10, amount: 2, remarks: 'first' },
          { material: 11, amount: 5, remarks: 'second' },
        ]),
      },
    ])
  })

  test('sends an amount the request declares, not the string the input binds', async () => {
    const wrapper = await readyToSave()

    await addProduct(wrapper, { id: 10, name: 'Widget' }, '2')
    await submit(wrapper)
    await settle()

    expect(writes()[0].body.materials).toEqual([{ material: 10, amount: 2, remarks: '' }])
  })

  // REGRESSION: the editor checked only the product and the amount, so a
  // remark over the request's 255 characters was staged, the save's parse
  // threw, and Submit did nothing at all. The row is now refused in the panel.
  test('a product remark over 255 characters is refused in the panel, not at the save', async () => {
    const wrapper = await readyToSave()

    await addProduct(wrapper, { id: 10, name: 'Widget' }, 2, 'x'.repeat(256))

    expect(stagedRows(wrapper)).toEqual([])
    expect(wrapper.findAll('.material-rows .invalid-feedback.d-block').map((node) => node.text())).toEqual([
      'Please use at most 255 characters',
    ])

    await wrapper.get('#material-rows-remarks').setValue('x'.repeat(255))
    await button(wrapper, 'Add product').trigger('click')
    await settle()
    await submit(wrapper)
    await settle()

    expect(writes()).toHaveLength(1)
    expect(writes()[0].body.materials).toEqual([{ material: 10, amount: 2, remarks: 'x'.repeat(255) }])
  })

  test('formats expected_entry_date as YYYY-MM-DD before sending', async () => {
    const wrapper = await readyToSave()

    // Local evening, where toISOString() would already say the day after.
    await pickDate(wrapper, new Date(2026, 2, 4, 23, 30))
    await submit(wrapper)
    await settle()

    expect(writes()[0].body.expected_entry_date).toBe('2026-03-04')
  })

  test('never sends purchase_order_id: the server assigns it', async () => {
    const wrapper = await readyToSave()

    await submit(wrapper)
    await settle()

    expect(writes()[0].body).not.toHaveProperty('purchase_order_id')
  })

  test('sends the contact fields as they were edited', async () => {
    const wrapper = await readyToSave()

    await wrapper.get('#purchaseorder_order_reference').setValue('PO 77')
    await wrapper.get('#purchaseorder_order_mobile').setValue('06-99')
    await wrapper.get('#purchaseorder_order_tel').setValue('020-99')
    await wrapper.get('#purchaseorder_order_contact').setValue('Piet')
    await wrapper.get('#purchaseorder_description').setValue('Rush')
    await wrapper.get('#purchaseorder_supplier_remarks').setValue('Call first')
    await submit(wrapper)
    await settle()

    expect(writes()[0].body).toMatchObject({
      order_reference: 'PO 77',
      order_mobile: '06-99',
      order_tel: '020-99',
      order_contact: 'Piet',
      description: 'Rush',
      supplier_remarks: 'Call first',
    })
  })

  test('sends nothing when the supplier is missing, and says so under each read-only detail', async () => {
    const wrapper = await readyToCreate()
    await pickDate(wrapper)

    await submit(wrapper)
    await settle()

    expect(writes()).toEqual([])
    const messages = wrapper.findAll('.invalid-feedback.d-block').map((feedback) => feedback.text())
    expect(messages).toEqual(Array(5).fill('Please select a supplier or reservation'))
  })

  test('sends nothing when the date has been cleared', async () => {
    const wrapper = await readyToSave()

    datePicker(wrapper).vm.$emit('update:modelValue', null)
    await settle()
    await submit(wrapper)
    await settle()

    expect(writes()).toEqual([])
    expect(wrapper.text()).toContain('Please enter a date')
  })

  test('navigates back and re-enables the button on success', async () => {
    const wrapper = await readyToSave()

    await submit(wrapper)
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(button(wrapper, 'Submit').attributes('disabled')).toBeUndefined()
  })

  test('a failed save creates nothing, and the retry is the same single request', async () => {
    // The order and its products are one atomic request, so there is no
    // half-saved order for the retry to duplicate: the second attempt is the
    // first attempt again, not a second parent for the same products.
    let attempts = 0
    api.post(ORDERS, () => {
      attempts += 1
      return attempts === 1
        ? HttpResponse.json({ detail: 'boom' }, { status: 500 })
        : detailResponse({ id: 100, materials: [] })
    })
    const wrapper = await readyToSave()
    await addProduct(wrapper, { id: 10, name: 'Widget' }, 2)

    await submit(wrapper)
    await settle()

    expect(routerGo()).not.toHaveBeenCalled()
    expect(titles()).toEqual(['Error'])
    expect(bodies()).toEqual(['Error creating purchase order'])
    expect(button(wrapper, 'Submit').attributes('disabled')).toBeUndefined()
    expect(writes().map((request) => request.path)).toEqual([ORDERS])

    await submit(wrapper)
    await settle()

    expect(writes().map((request) => request.path)).toEqual([ORDERS, ORDERS])
    expect(writes()[1].body).toEqual(writes()[0].body)
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('shows a single toast for the order and none per product', async () => {
    const wrapper = await readyToSave()

    await addProduct(wrapper, { id: 10, name: 'Widget' }, 1)
    await addProduct(wrapper, { id: 11, name: 'Gadget' }, 2)
    await submit(wrapper)
    await settle()

    expect(titles()).toEqual(['Created'])
    expect(bodies()).toEqual(['Purchase order has been created'])
  })

  test('starts on an empty order for the Netherlands', async () => {
    const wrapper = await readyToCreate()

    expect(wrapper.text()).toContain('New purchase order')
    expect(field(wrapper, 'order_country_code')).toBe('NL')
    expect(field(wrapper, 'order_name')).toBe('')
    expect(wrapper.find('.material-rows').exists()).toBe(false)
    expect(wrapper.text()).toContain('Select a supplier or reservation')
    expect(api.requests()).toEqual([])
  })
})

// The expected entry date starts on the next working day.
describe('PurchaseOrderForm - the default expected entry date', () => {
  // 2026-03-04 is a Wednesday.
  test.each([
    ['a Wednesday', '2026-03-04T10:00:00', '2026-03-05'],
    ['a Friday', '2026-03-06T10:00:00', '2026-03-09'],
    ['a Saturday', '2026-03-07T10:00:00', '2026-03-09'],
    ['a Sunday', '2026-03-08T10:00:00', '2026-03-09'],
  ])('on %s it is the next weekday', async (_day, now, expected) => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(now))
    const wrapper = await readyToCreate()
    await pickSupplier(wrapper)

    await submit(wrapper)
    await settle()

    expect(writes()[0].body.expected_entry_date).toBe(expected)
  })
})

describe('PurchaseOrderForm - update', () => {
  test('reads the order into the form: the details, the ISO date and the stored products', async () => {
    const wrapper = await readyToEdit()

    expect(wrapper.text()).toContain('Edit purchase order')
    expect(field(wrapper, 'order_name')).toBe('ACME')
    expect(field(wrapper, 'order_city')).toBe('Amsterdam')
    expect(field(wrapper, 'order_reference')).toBe('REF-1')
    expect(field(wrapper, 'description')).toBe('first order')
    // The response's display string is '04/03/2026'; the form reads the twin
    // beside it rather than parsing that string, which is only right for the
    // tenants whose date_format happens to match.
    const date = datePicker(wrapper).props('modelValue')
    expect(date).toBeInstanceOf(Date)
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 2, 4])
    expect(stagedRows(wrapper)).toEqual([['Widget', '3', 'first'], ['Gadget', '5', '']])
    expect(api.requests()).toEqual([{ method: 'get', path: '/api/inventory/purchaseorder/42/', query: {} }])
  })

  test('an edit keeps its supplier: no supplier or reservation picker', async () => {
    const wrapper = await readyToEdit()

    expect(supplierPicker(wrapper).exists()).toBe(false)
    expect(reservationPicker(wrapper).exists()).toBe(false)
  })

  test('sends one request carrying the order and its whole product list', async () => {
    const wrapper = await readyToEdit()

    // Row 7 is stored, so it updates; the row without an id is created; the
    // stored row 8 the list leaves out is what the endpoint deletes.
    await editStagedRow(wrapper, 0)
    await wrapper.get('#material-rows-amount').setValue('9')
    await button(wrapper, 'Edit product').trigger('click')
    await settle()
    await deleteStagedRow(wrapper, 1)
    await addProduct(wrapper, { id: 12, name: 'Sprocket' }, 4)
    await submit(wrapper)
    await settle()

    expect(writes()).toEqual([
      {
        method: 'patch',
        path: '/api/inventory/purchaseorder/42/with-materials/',
        query: {},
        body: createBody(
          [
            { id: 7, material: 10, amount: 9, remarks: 'first' },
            { material: 12, amount: 4, remarks: '' },
          ],
          { order_reference: 'REF-1', description: 'first order' },
        ),
      },
    ])
  })

  // REGRESSION. The row editor works on a copy since the migration (the
  // legacy bound it live to the row), so a Submit with an edit open saved the
  // row as it was before the edit, and dropped the edit without a word.
  test('Submit with a row edit open saves the edit', async () => {
    const wrapper = await readyToEdit()
    await editStagedRow(wrapper, 0)
    await wrapper.get('#material-rows-amount').setValue('9')

    await submit(wrapper)
    await settle()

    expect(writes()).toHaveLength(1)
    expect(writes()[0].body.materials).toEqual([
      { id: 7, material: 10, amount: 9, remarks: 'first' },
      { id: 8, material: 11, amount: 5, remarks: null },
    ])
  })

  test('Submit with an invalid row edit open sends nothing and says why', async () => {
    const wrapper = await readyToEdit()
    await editStagedRow(wrapper, 0)
    await wrapper.get('#material-rows-amount').setValue('0')

    await submit(wrapper)
    await settle()

    expect(writes()).toEqual([])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.findAll('.material-rows .invalid-feedback.d-block').map((feedback) => feedback.text())).toEqual([
      'Please enter an amount',
    ])
    expect(button(wrapper, 'Submit').attributes('disabled')).toBeUndefined()
  })

  test('sends the date it read back, formatted', async () => {
    const wrapper = await readyToEdit()

    await submit(wrapper)
    await settle()

    expect(writes()[0].body.expected_entry_date).toBe('2026-03-04')
  })

  test('falls back on the display string when the response has no ISO twin', async () => {
    api.get(ORDER_DETAIL, () => detailResponse({ expected_entry_date_iso: null }))
    const wrapper = await readyToEdit()

    await submit(wrapper)
    await settle()

    expect(writes()[0].body.expected_entry_date).toBe('2026-03-04')
  })

  test('deletes a removed product by leaving it out, not with a request of its own', async () => {
    const wrapper = await readyToEdit()

    await deleteStagedRow(wrapper, 0)
    await submit(wrapper)
    await settle()

    expect(writes()).toHaveLength(1)
    expect(writes()[0].body.materials).toEqual([{ id: 8, material: 11, amount: 5, remarks: null }])
    expect(api.requests().map((request) => request.method)).not.toContain('delete')
  })

  test('does not navigate when the save fails', async () => {
    api.patch(ORDER, () => HttpResponse.json({ detail: 'boom' }, { status: 500 }))
    const wrapper = await readyToEdit()

    await submit(wrapper)
    await settle()

    expect(routerGo()).not.toHaveBeenCalled()
    expect(button(wrapper, 'Submit').attributes('disabled')).toBeUndefined()
    expect(titles()).toEqual(['Error'])
    expect(bodies()).toEqual(['Error updating purchase order'])
  })

  test('shows the order toast once, whatever the product list holds', async () => {
    const wrapper = await readyToEdit()

    await submit(wrapper)
    await settle()

    expect(titles()).toEqual(['Updated'])
    expect(bodies()).toEqual(['Purchase order has been updated'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a failed read tells the user', async () => {
    api.get(ORDER_DETAIL, serverError)
    await readyToEdit()

    expect(bodies()).toContain('Error fetching purchase order')
  })
})

describe('PurchaseOrderForm - the supplier', () => {
  test('picking one copies its details onto the order and offers its products', async () => {
    const wrapper = await readyToCreate()

    await pickSupplier(wrapper)

    expect(field(wrapper, 'order_name')).toBe('ACME')
    expect(field(wrapper, 'order_address')).toBe('Street 1')
    expect(field(wrapper, 'order_postal')).toBe('1000AA')
    expect(field(wrapper, 'order_city')).toBe('Amsterdam')
    expect(field(wrapper, 'order_country_code')).toBe('NL')
    expect(field(wrapper, 'order_tel')).toBe('020')
    expect(field(wrapper, 'order_mobile')).toBe('06')
    expect(field(wrapper, 'order_contact')).toBe('Jan')
    expect(field(wrapper, 'supplier_remarks')).toBe('none')
    expect(wrapper.find('.material-rows').exists()).toBe(true)
  })

  test('the copied details are read-only; the contact fields stay editable', async () => {
    const wrapper = await readyToCreate()

    for (const id of ['order_name', 'order_address', 'order_postal', 'order_city', 'order_country_code']) {
      expect(wrapper.get(`#purchaseorder_${id}`).attributes('readonly')).toBeDefined()
    }
    for (const id of ['order_reference', 'order_mobile', 'order_tel', 'order_contact', 'description', 'supplier_remarks']) {
      expect(wrapper.get(`#purchaseorder_${id}`).attributes('readonly')).toBeUndefined()
    }
  })

  test('picking another supplier clears the products staged for the first', async () => {
    const wrapper = await readyToSave()
    await addProduct(wrapper, { id: 10, name: 'Widget' }, 2)
    expect(stagedRows(wrapper)).toHaveLength(1)

    await pickSupplier(wrapper, supplierRow({ id: 4, name: 'Other BV' }))

    expect(stagedRows(wrapper)).toEqual([])
    expect(field(wrapper, 'order_name')).toBe('Other BV')
    await submit(wrapper)
    await settle()
    expect(writes()[0].body).toMatchObject({ supplier: 4, order_name: 'Other BV', materials: [] })
  })

  test('the supplier search asks the autocomplete endpoint for what was typed', async () => {
    const wrapper = await readyToCreate()

    supplierPicker(wrapper).vm.$emit('search-change', 'acm')
    // The search is debounced; zero in specs.
    await settle()

    expect(api.requests()).toEqual([{ method: 'get', path: SUPPLIERS, query: { q: 'acm' } }])
  })

  test('the product search is scoped to the chosen supplier', async () => {
    const wrapper = await readyToCreate()
    await pickSupplier(wrapper)

    await searchProducts(wrapper, 'wid')

    expect(api.requests().filter((request) => request.path === MATERIALS)).toEqual([
      { method: 'get', path: MATERIALS, query: { q: 'wid', supplier: '3' } },
    ])
  })
})

describe('PurchaseOrderForm - the reservation', () => {
  async function pickReservation(wrapper, option = reservationOption()) {
    reservationPicker(wrapper).vm.$emit('select', option)
    await settle()
  }

  test('the reservation search asks its autocomplete endpoint for what was typed', async () => {
    const wrapper = await readyToCreate()

    reservationPicker(wrapper).vm.$emit('search-change', 'acm')
    // The search is debounced; zero in specs.
    await settle()

    expect(api.requests()).toEqual([{ method: 'get', path: RESERVATIONS, query: { q: 'acm' } }])
  })

  test('picking one copies its supplier onto the order and links the order to it', async () => {
    const wrapper = await readyToCreate()
    await pickDate(wrapper)

    await pickReservation(wrapper)
    await submit(wrapper)
    await settle()

    expect(field(wrapper, 'order_name')).toBe('ACME')
    expect(writes()[0].body).toMatchObject({
      supplier_reservation: 55,
      supplier: 3,
      order_name: 'ACME',
      order_city: 'Amsterdam',
    })
  })

  test('its products become rows of the order', async () => {
    const wrapper = await readyToCreate()

    await pickReservation(wrapper)

    expect(stagedRows(wrapper)).toEqual([['Widget', '2', 'reserved'], ['Gadget', '4', '']])
  })

  // REGRESSION: the legacy form copied the reservation's products as they came,
  // and those rows carry the reservation material's `id`. The with-materials
  // save reads an `id` as "update that stored purchase order row", so it sent
  // ids (77, 78) that are not this order's to address. A row taken over from a
  // reservation is a new row: no `id`.
  test('sends the reservation\'s products as new rows, without the reservation rows\' ids', async () => {
    const wrapper = await readyToCreate()
    await pickDate(wrapper)

    await pickReservation(wrapper)
    await submit(wrapper)
    await settle()

    expect(writes()[0].body.materials).toEqual([
      { material: 10, amount: 2, remarks: 'reserved' },
      { material: 11, amount: 4, remarks: null },
    ])
  })

  test('a supplier picked afterwards replaces the reservation\'s products', async () => {
    const wrapper = await readyToCreate()
    await pickReservation(wrapper)

    await pickSupplier(wrapper, supplierRow({ id: 4, name: 'Other BV' }))

    expect(stagedRows(wrapper)).toEqual([])
  })
})

describe('PurchaseOrderForm - route props', () => {
  // The `purchaseorder-add-from-reservation` route passes `reservation_pk`.
  // Nothing reads it yet, so that route renders an ordinary empty create form:
  // preserved, and reported as left open.
  test('reservation_pk is accepted and ignored: an empty create form, no reads, no stray attribute', async () => {
    const wrapper = mountOrder({ reservation_pk: 55 })
    await settle()

    expect(wrapper.text()).toContain('New purchase order')
    expect(field(wrapper, 'order_name')).toBe('')
    expect(api.requests()).toEqual([])
    expect(wrapper.attributes('reservation_pk')).toBeUndefined()
  })
})

describe('PurchaseOrderForm - the header', () => {
  test('Cancel and the back link both go back', async () => {
    const wrapper = await readyToCreate()

    await button(wrapper, 'Cancel').trigger('click')
    await wrapper.get('.backlink').trigger('click')

    expect(routerGo()).toHaveBeenCalledTimes(2)
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })
})

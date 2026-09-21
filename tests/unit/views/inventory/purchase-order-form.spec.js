import { beforeEach, describe, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'

import PurchaseOrderForm from '@/views/inventory/PurchaseOrderForm.vue'

import {
  vAddressAutocompleteRow,
  vAutocompleteRow,
  vPurchaseOrderDetail,
  vPurchaseOrderList,
  vPurchaseOrderMaterial,
} from '@/api/valibot.gen'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import {
  mountForm,
  routerGo,
  toastCreate,
  toastTitles,
} from '../../support/form-harness.js'

// THE SAVE IS ONE REQUEST.
//
// The form used to write the order and then one request per product row
// through BaseModel.updateCollection, which threw on the first failure: on the
// create path that left an order with half its products and, on the retry, a
// second order. `POST/PATCH /api/inventory/purchaseorder[/{id}]/with-materials/`
// takes the parent and the whole `materials` list in one request, so what this
// spec pins is the traffic a given form state produces - which endpoints, in
// which order, with which bodies - plus the two guarantees that come with it:
// a failed save leaves nothing behind, and a retry re-sends the same single
// request rather than a second parent.
//
// The requests are read off the wire (tests/unit/support/api-seam), and the
// seam validates each body against the operation's generated request schema.
// The per-row endpoints are stubbed but never expected to be called: if the
// loop comes back, the assertion below names the leaked requests instead of
// failing with "no response registered".

// vi.mock is hoisted and scoped per module, so the mock itself has to live here;
// it points at the harness's shared spy.
vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  // Spread the original: the auto-import resolver turns <b-form-input> & co
  // into named imports from here, so replacing the module would blank them out.
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

const api = installApiSeam()

const ORDERS = '/api/inventory/purchaseorder/with-materials/'
const ORDER = '/api/inventory/purchaseorder/{id}/with-materials/'
const ORDER_DETAIL = '/api/inventory/purchaseorder/{id}/'
const SUPPLIERS = '/api/inventory/supplier/autocomplete/'
const MATERIALS = '/api/inventory/material/autocomplete/'
/** The per-product endpoints the loop used. Stubbed so a leak is nameable. */
const ORDER_CREATE = '/api/inventory/purchaseorder/'
const ROW_CREATE = '/api/inventory/purchaseorder-material/'
const ROW = '/api/inventory/purchaseorder-material/{id}/'

const SUPPLIER = {
  id: 3,
  name: 'ACME',
  address: 'Street 1',
  city: 'Amsterdam',
  postal: '1000AA',
  country_code: 'NL',
  tel: '020',
  mobile: '06',
  email: 'a@b.nl',
  contact: 'Jan',
  remarks: 'none',
}

/**
 * The two type-ahead rows, built the long way round.
 *
 * `vSupplierAutocomplete` and `vMaterialAutocomplete` are each an `intersect`
 * of a shared autocomplete row and the type's own half, and `fixtureFor`
 * cannot walk an intersect (it has no `entries`): the shared half comes from
 * the generated row and the rest is written out, which is the shape the seam
 * then checks.
 */
function supplierRow(overrides = {}) {
  return {
    ...fixtureFor(vAddressAutocompleteRow, { ...SUPPLIER, ...overrides }),
    identifier: 'SUP-1',
  }
}

function materialRow(overrides = {}) {
  return {
    ...fixtureFor(vAutocompleteRow, { id: 10, name: 'Widget', ...overrides }),
    identifier: 'MAT-1',
    price_purchase: '1.00',
    price_selling: '2.00',
    price_selling_alt: '2.00',
    image: '',
  }
}

/** Every write the form made, in call order. Reads are noise here. */
function writes() {
  return api.requests().filter((request) => request.method !== 'get')
}

/**
 * The body a create sends, whole.
 *
 * It is the form's own record - the model's blank purchase order with the two
 * fields a test overrides - plus the materials list. `purchase_order_id` is
 * absent because `PurchaseOrder.preInsert` drops it: the server assigns it.
 */
function createBody(materials) {
  return {
    order_name: 'ACME',
    order_address: '',
    order_postal: '',
    order_city: '',
    order_country_code: 'NL',
    supplier_reservation: null,
    supplier: 3,
    order_reference: '',
    order_tel: '',
    order_mobile: '',
    order_email: '',
    order_contact: '',
    expected_entry_date: '2026-03-04',
    supplier_remarks: '',
    description: '',
    statuses: [],
    entries: [],
    reservation_materials: [],
    materials,
  }
}

/**
 * The detail GET, answered the way the backend answers it.
 *
 * Deliberately an explicit `HttpResponse`, which opts out of the seam's
 * response check, because the declaration is what is wrong here:
 * `expected_entry_date` is declared `format: date` (ISO) while
 * `PurchaseOrderDetailSerializer.to_representation` rewrites it through
 * `TransformDatesMixin.format_date` into the tenant's `date_format` -
 * `04/03/2026` under the `DD/MM/YYYY` this form parses
 * (`PurchaseOrder.detail`). A conforming stub would have the form read an
 * Invalid Date and send that back, which is not the screen's behaviour.
 */
function detailResponse(overrides = {}) {
  return new HttpResponse(
    JSON.stringify({
      ...fixtureFor(vPurchaseOrderDetail, {
        id: 42,
        supplier: 3,
        order_name: 'ACME',
        materials: [],
        ...overrides,
      }),
      expected_entry_date: '04/03/2026',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

beforeEach(() => {
  api.get(SUPPLIERS, () => [supplierRow()])
  api.get(MATERIALS, () => [materialRow()])
  api.get(ORDER_DETAIL, () => detailResponse())
  // The parent comes back as the backend builds it: the order it stored, with
  // the materials list it was handed, each row now carrying its stored id.
  api.post(ORDERS, ({ body }) => fixtureFor(vPurchaseOrderDetail, {
    id: 100,
    supplier: body.supplier,
    order_name: 'ACME',
    materials: body.materials.map((row, index) => ({ ...row, id: 100 + index })),
  }))
  api.patch(ORDER, ({ body }) => fixtureFor(vPurchaseOrderDetail, {
    id: 42,
    supplier: body.supplier,
    order_name: 'ACME',
    materials: body.materials,
  }))
  api.post(ORDER_CREATE, () => fixtureFor(vPurchaseOrderList, { id: 100 }))
  api.post(ROW_CREATE, () => fixtureFor(vPurchaseOrderMaterial, { id: 100 }))
  api.patch(ROW, () => fixtureFor(vPurchaseOrderMaterial, { id: 7 }))
  api.delete(ROW, () => noContent())
  toastCreate.mockClear()
})

/** Mount this form. Thin wrapper so the tests read the same as before. */
function mount(props = {}, stubs = {}) {
  return mountForm(PurchaseOrderForm, { props, stubs })
}

/** A create form with a supplier, an order name and a fixed date. */
async function readyToCreate() {
  const wrapper = mount()
  await settle()

  wrapper.vm.purchaseOrder.supplier = 3
  wrapper.vm.purchaseOrder.order_name = 'ACME'
  wrapper.vm.purchaseOrder.expected_entry_date = new Date('2026-03-04T12:00:00Z')

  return wrapper
}

describe('PurchaseOrderForm - create', () => {
  test('sends one request carrying the order and its whole product list', async () => {
    const wrapper = await readyToCreate()

    wrapper.vm.purchaseOrder.materials = [
      { material: 10, amount: 2, remarks: 'first' },
      { material: 11, amount: 5, remarks: 'second' },
    ]

    await wrapper.vm.submitForm()

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
    const wrapper = await readyToCreate()

    // A text input hands over strings; the request declares integers.
    wrapper.vm.purchaseOrder.materials = [{ material: 10, amount: '2' }]

    await wrapper.vm.submitForm()

    expect(writes()[0].body.materials).toEqual([
      { material: 10, amount: 2, remarks: null },
    ])
  })

  test('formats expected_entry_date as YYYY-MM-DD before sending', async () => {
    const wrapper = await readyToCreate()

    wrapper.vm.purchaseOrder.materials = []

    await wrapper.vm.submitForm()

    expect(writes()[0].body.expected_entry_date).toBe('2026-03-04')
  })

  test('drops purchase_order_id when creating', async () => {
    const wrapper = await readyToCreate()

    wrapper.vm.purchaseOrder.purchase_order_id = 'should-not-be-sent'
    wrapper.vm.purchaseOrder.materials = []

    await wrapper.vm.submitForm()

    expect(writes()[0].body).not.toHaveProperty('purchase_order_id')
  })

  test('sends nothing when the supplier is missing', async () => {
    const wrapper = await readyToCreate()

    wrapper.vm.purchaseOrder.supplier = null
    wrapper.vm.purchaseOrder.materials = [{ material: 10, amount: 1 }]

    await wrapper.vm.submitForm()

    expect(writes()).toEqual([])
  })

  test('navigates back and re-enables the button on success', async () => {
    const wrapper = await readyToCreate()

    wrapper.vm.purchaseOrder.materials = []

    await wrapper.vm.submitForm()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
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
        : fixtureFor(vPurchaseOrderDetail, { id: 100 })
    })

    const wrapper = await readyToCreate()
    wrapper.vm.purchaseOrder.materials = [{ material: 10, amount: 2 }]

    await wrapper.vm.submitForm()

    expect(routerGo()).not.toHaveBeenCalled()
    expect(toastTitles()).toEqual(['Error'])
    expect(writes().map((request) => request.path)).toEqual([ORDERS])

    await wrapper.vm.submitForm()

    expect(writes().map((request) => request.path)).toEqual([ORDERS, ORDERS])
    expect(writes()[1].body).toEqual(writes()[0].body)
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })
})

describe('PurchaseOrderForm - update', () => {
  async function editWrapper() {
    const wrapper = mount({ pk: 42 })
    await settle()
    await vi.waitFor(() => expect(wrapper.vm.purchaseOrder.order_name).toBe('ACME'))

    return wrapper
  }

  test('sends one request carrying the order and its whole product list', async () => {
    const wrapper = await editWrapper()

    // id 7 is stored, so the row updates it; the row without an id is created;
    // the stored row the list leaves out is what the endpoint deletes.
    wrapper.vm.purchaseOrder.materials = [
      { id: 7, material: 10, amount: 3 },
      { material: 11, amount: 4 },
    ]

    await wrapper.vm.submitForm()

    expect(writes()).toEqual([
      {
        method: 'patch',
        path: '/api/inventory/purchaseorder/42/with-materials/',
        query: {},
        body: expect.objectContaining({
          supplier: 3,
          order_name: 'ACME',
          expected_entry_date: '2026-03-04',
          materials: [
            { id: 7, material: 10, amount: 3, remarks: null },
            { material: 11, amount: 4, remarks: null },
          ],
        }),
      },
    ])
  })

  test('parses the API date into a Date the picker can use, and sends it back formatted', async () => {
    const wrapper = await editWrapper()

    // The detail endpoint returns DD/MM/YYYY; the form needs a Date.
    expect(wrapper.vm.purchaseOrder.expected_entry_date).toBeInstanceOf(Date)

    await wrapper.vm.submitForm()

    expect(writes()[0].body.expected_entry_date).toBe('2026-03-04')
  })

  test('deletes a removed product by leaving it out, not with a request of its own', async () => {
    const wrapper = await editWrapper()

    wrapper.vm.purchaseOrder.materials = [{ id: 7, material: 10, amount: 3 }]
    wrapper.vm.deleteMaterial(0)
    await wrapper.vm.submitForm()

    expect(writes()[0].body.materials).toEqual([])
    expect(api.requests().map((request) => request.method)).not.toContain('delete')
  })

  test('does not navigate when the save fails', async () => {
    api.patch(ORDER, () => HttpResponse.json({ detail: 'boom' }, { status: 500 }))

    const wrapper = await editWrapper()
    wrapper.vm.purchaseOrder.materials = [{ id: 7, material: 10, amount: 3 }]

    await wrapper.vm.submitForm()

    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(toastTitles()).toEqual(['Error'])
  })
})

// The per-material toasts are gone with the per-material requests: there is one
// save and one outcome to report for it. The copy is the legacy copy.
describe('PurchaseOrderForm - toasts', () => {
  test('create shows a single toast for the order and none per product', async () => {
    const wrapper = await readyToCreate()

    wrapper.vm.purchaseOrder.materials = [{ material: 10, amount: 1 }, { material: 11, amount: 2 }]

    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Created'])
  })

  test('update shows the order toast once, whatever the product list holds', async () => {
    const wrapper = mount({ pk: 42 })
    await settle()
    await vi.waitFor(() => expect(wrapper.vm.purchaseOrder.order_name).toBe('ACME'))
    toastCreate.mockClear()

    wrapper.vm.purchaseOrder.materials = [
      { id: 7, material: 10, amount: 3 },
      { material: 11, amount: 4 },
    ]

    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Updated'])
  })

  test('a failed save reports the error and nothing else', async () => {
    api.patch(ORDER, () => HttpResponse.json({ detail: 'boom' }, { status: 500 }))

    const wrapper = mount({ pk: 42 })
    await settle()
    await vi.waitFor(() => expect(wrapper.vm.purchaseOrder.order_name).toBe('ACME'))
    toastCreate.mockClear()

    wrapper.vm.purchaseOrder.materials = [{ id: 7, amount: 1 }]

    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Error'])
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('PurchaseOrderForm - product list editing', () => {
  test('deleteMaterial removes the product from the list', async () => {
    const wrapper = await readyToCreate()

    wrapper.vm.purchaseOrder.materials = [{ id: 1, material: 10 }, { id: 2, material: 11 }]

    wrapper.vm.deleteMaterial(0)

    expect(wrapper.vm.purchaseOrder.materials.map((m) => m.id)).toEqual([2])
  })

  test('doEditMaterial replaces the product at the edited index', async () => {
    const wrapper = await readyToCreate()

    wrapper.vm.purchaseOrder.materials = [{ id: 1, amount: 1 }, { id: 2, amount: 2 }]
    wrapper.vm.editMaterial({ id: 1, amount: 99 }, 0)
    wrapper.vm.doEditMaterial()

    expect(wrapper.vm.purchaseOrder.materials[0].amount).toBe(99)
    expect(wrapper.vm.isEditMaterial).toBe(false)
    expect(wrapper.vm.editIndex).toBeNull()
  })

  // selectMaterial focuses the amount input through a ref. That ref moved from
  // this.$refs.amount to a <script setup> template ref during the Composition
  // API conversion, which is the kind of change that fails silently, so it gets
  // a test of its own. The input is stubbed here, hence the explicit stub with
  // a focus method.
  // The materials block is guarded by v-if="purchaseOrder.order_name", so the
  // amount input only exists once a supplier has been picked. Both helpers below
  // go through that path first, which is also the only way a user can reach
  // selectMaterial.
  async function wrapperWithSupplier(focus) {
    const wrapper = mount({}, {
      BFormInput: { template: '<input />', methods: { focus } },
    })
    await settle()

    wrapper.vm.purchaseOrder.order_name = 'ACME'
    wrapper.vm.purchaseOrder.supplier = 3
    await wrapper.vm.$nextTick()

    return wrapper
  }

  test('selectMaterial copies the product and focuses the amount input', async () => {
    const focus = vi.fn()
    const wrapper = await wrapperWithSupplier(focus)

    wrapper.vm.selectMaterial({ id: 10, name: 'Widget' })

    expect(wrapper.vm.material.material).toBe(10)
    expect(wrapper.vm.material.material_view.name).toBe('Widget')
    expect(wrapper.vm.material.amount).toBe(0)
    expect(focus).toHaveBeenCalled()
  })

  test('selectMaterial keeps amount and remarks while editing', async () => {
    const focus = vi.fn()
    const wrapper = await wrapperWithSupplier(focus)

    wrapper.vm.editMaterial({ id: 1, material_view: {}, amount: 7, remarks: 'keep' }, 0)
    wrapper.vm.selectMaterial({ id: 10, name: 'Widget' })

    expect(wrapper.vm.material.amount).toBe(7)
    expect(wrapper.vm.material.remarks).toBe('keep')
  })

  test('selectSupplier copies the supplier details and clears the products', async () => {
    const wrapper = await readyToCreate()

    wrapper.vm.purchaseOrder.materials = [{ id: 1 }]
    wrapper.vm.selectSupplier(SUPPLIER)
    await settle()

    expect(wrapper.vm.purchaseOrder).toMatchObject({
      supplier: 3,
      order_name: 'ACME',
      order_city: 'Amsterdam',
      order_email: 'a@b.nl',
    })
    expect(wrapper.vm.purchaseOrder.materials).toEqual([])
  })

  test('selectReservation copies the nested supplier details', async () => {
    const wrapper = await readyToCreate()

    wrapper.vm.selectReservation({
      id: 55,
      supplier: SUPPLIER,
      products: [{ material: 10, amount: 1 }],
    })

    expect(wrapper.vm.purchaseOrder).toMatchObject({
      supplier_reservation: 55,
      supplier: 3,
      order_name: 'ACME',
    })
    expect(wrapper.vm.purchaseOrder.materials).toEqual([{ material: 10, amount: 1 }])
  })

  test('the product search is scoped to the chosen supplier', async () => {
    const wrapper = await readyToCreate()

    wrapper.vm.purchaseOrder.supplier = 3
    await wrapper.vm.getMaterials('wid')
    await settle()

    expect(api.requests().filter((request) => request.path === MATERIALS)).toEqual([
      { method: 'get', path: MATERIALS, query: { q: 'wid', supplier: '3' } },
    ])
  })
})

// The add-material guard. Mutation testing showed this was entirely unpinned:
// isMaterialValid could be replaced by `true`, by `false`, or have its `&&`
// turned into `||`, and every existing test still passed. Mirrors the block of
// the same name in supplier-reservation-form.spec.js - the two forms share this
// guard verbatim.
describe('PurchaseOrderForm - the add-material guard', () => {
  async function setMaterial(wrapper, fields) {
    Object.assign(wrapper.vm.material, fields)
    await wrapper.vm.$nextTick()
  }

  test('adds the product when both fields are valid', async () => {
    const wrapper = await readyToCreate()
    await setMaterial(wrapper, { material: 10, amount: 2 })

    wrapper.vm.addMaterial()

    expect(wrapper.vm.purchaseOrder.materials).toHaveLength(1)
    expect(wrapper.vm.purchaseOrder.materials[0]).toMatchObject({
      material: 10,
      amount: 2,
    })
  })

  // Exactly one of the two checks fails here, which is what distinguishes
  // `&&` from `||` in the guard.
  test('refuses to add when no product has been chosen', async () => {
    const wrapper = await readyToCreate()
    await setMaterial(wrapper, { material: null, amount: 2 })

    wrapper.vm.addMaterial()

    expect(wrapper.vm.purchaseOrder.materials).toHaveLength(0)
  })

  // Pins greaterThanZero: zero is not a valid amount, so `>` may not become `>=`.
  test('refuses to add an amount of zero', async () => {
    const wrapper = await readyToCreate()
    await setMaterial(wrapper, { material: 10, amount: 0 })

    wrapper.vm.addMaterial()

    expect(wrapper.vm.purchaseOrder.materials).toHaveLength(0)
  })

  test('clears the draft product after a successful add', async () => {
    const wrapper = await readyToCreate()
    await setMaterial(wrapper, { material: 10, amount: 2 })

    wrapper.vm.addMaterial()

    expect(wrapper.vm.material.material).toBeFalsy()
  })
})

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'

import SupplierReservationForm from '@/views/inventory/SupplierReservationForm.vue'

import {
  vMaterial,
  vSupplier,
  vSupplierReservation,
  vSupplierReservationMaterial,
} from '@/api/valibot.gen'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import {
  mountForm,
  routerGo,
  toastCreate,
  toastTitles,
} from '../../support/form-harness.js'

// THE SAVE IS ONE REQUEST.
//
// The form used to write the reservation and then one request per product row
// through BaseModel.updateCollection, which threw on the first failure: on the
// create path that left a reservation with half its products and, on the retry,
// a second reservation. `POST/PATCH /api/inventory/supplier-reservation[/{id}]/with-materials/`
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

const RESERVATIONS = '/api/inventory/supplier-reservation/with-materials/'
const RESERVATION = '/api/inventory/supplier-reservation/{id}/with-materials/'
const RESERVATION_DETAIL = '/api/inventory/supplier-reservation/{id}/'
const SUPPLIER_LIST = '/api/inventory/supplier/'
const MATERIAL_LIST = '/api/inventory/material/'
/** The per-product endpoints the loop used. Stubbed so a leak is nameable. */
const RESERVATION_CREATE = '/api/inventory/supplier-reservation/'
const ROW_CREATE = '/api/inventory/supplier-reservationmaterial/'
const ROW = '/api/inventory/supplier-reservationmaterial/{id}/'

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
  identifier: 'SUP-1',
}

/** Every write the form made, in call order. Reads are noise here. */
function writes() {
  return api.requests().filter((request) => request.method !== 'get')
}

/**
 * The body a save sends, whole: the reservation's own field and the product
 * list. `reservation` is not on a row - the parent supplies it.
 */
function reservationBody(materials) {
  return { supplier: 3, materials }
}

beforeEach(() => {
  api.get(SUPPLIER_LIST, () => paginated([fixtureFor(vSupplier, SUPPLIER)]))
  api.get(MATERIAL_LIST, () => paginated([
    fixtureFor(vMaterial, { id: 10, name: 'Widget' }),
    fixtureFor(vMaterial, { id: 11, name: 'Gadget' }),
  ]))
  api.get(RESERVATION_DETAIL, () => fixtureFor(vSupplierReservation, {
    id: 42,
    supplier: 3,
    supplier_view: fixtureFor(vSupplier, SUPPLIER),
    materials: [],
  }))
  // The parent comes back as the backend builds it: the reservation it stored,
  // with the materials list it was handed.
  api.post(RESERVATIONS, ({ body }) => fixtureFor(vSupplierReservation, {
    id: 100,
    supplier: body.supplier,
    supplier_view: fixtureFor(vSupplier, SUPPLIER),
    materials: body.materials.map((row, index) => fixtureFor(
      vSupplierReservationMaterial, { ...row, id: 100 + index, reservation: 100 },
    )),
  }))
  api.patch(RESERVATION, ({ body }) => fixtureFor(vSupplierReservation, {
    id: 42,
    supplier: body.supplier,
    supplier_view: fixtureFor(vSupplier, SUPPLIER),
    materials: body.materials.map((row) => fixtureFor(
      vSupplierReservationMaterial, { ...row, id: row.id ?? 101, reservation: 42 },
    )),
  }))
  api.post(RESERVATION_CREATE, () => fixtureFor(vSupplierReservation, { id: 100 }))
  api.post(ROW_CREATE, () => fixtureFor(vSupplierReservationMaterial, { id: 100 }))
  api.patch(ROW, () => fixtureFor(vSupplierReservationMaterial, { id: 7 }))
  api.delete(ROW, () => noContent())
  toastCreate.mockClear()
})

/** Mount this form. Thin wrapper so the tests read the same as before. */
function mount(props = {}, stubs = {}) {
  return mountForm(SupplierReservationForm, { props, stubs })
}

/** Wait for the async created() hook to settle. */
async function ready(wrapper) {
  await vi.waitFor(() => expect(wrapper.vm.isLoading).toBe(false))
  return wrapper
}

/**
 * Pick a supplier the way the UI does.
 *
 * This started as a workaround: while the component was options API, vuelidate
 * did not pick up a deep mutation of the supplierReservation object that
 * created() had replaced, so assigning supplierReservation.supplier directly
 * left $model null, submitForm's validity check bailed out, and nothing was
 * sent. The <script setup> conversion passes the state to useVuelidate
 * explicitly and fixes that - direct assignment works now, verified.
 *
 * Kept anyway, because going through the method is the real user path and
 * therefore the better test.
 */
async function pickSupplier(wrapper, supplier = SUPPLIER) {
  wrapper.vm.selectSupplier(supplier)
  await settle()
}

async function readyToCreate() {
  return ready(mount())
}

describe('SupplierReservationForm - create', () => {
  test('sends one request carrying the reservation and its whole product list', async () => {
    const wrapper = await readyToCreate()

    await pickSupplier(wrapper)
    wrapper.vm.supplierReservation.materials = [
      { material: 10, amount: 2, remarks: 'first' },
      { material: 11, amount: 5, remarks: 'second' },
    ]

    await wrapper.vm.submitForm()

    expect(writes()).toEqual([
      {
        method: 'post',
        path: RESERVATIONS,
        query: {},
        body: reservationBody([
          { material: 10, amount: 2, remarks: 'first' },
          { material: 11, amount: 5, remarks: 'second' },
        ]),
      },
    ])
  })

  test('sends an amount the request declares, not the string the input binds', async () => {
    const wrapper = await readyToCreate()

    await pickSupplier(wrapper)
    // A text input hands over strings; the request declares integers.
    wrapper.vm.supplierReservation.materials = [{ material: 10, amount: '2' }]

    await wrapper.vm.submitForm()

    expect(writes()[0].body).toEqual(reservationBody([
      { material: 10, amount: 2, remarks: null },
    ]))
  })

  test('sends nothing when the supplier is missing', async () => {
    const wrapper = await readyToCreate()

    wrapper.vm.supplierReservation.supplier = null
    wrapper.vm.supplierReservation.materials = [{ material: 10, amount: 1 }]

    await wrapper.vm.submitForm()

    expect(writes()).toEqual([])
  })

  test('navigates back and re-enables the button on success', async () => {
    const wrapper = await readyToCreate()

    await pickSupplier(wrapper)
    wrapper.vm.supplierReservation.materials = []

    await wrapper.vm.submitForm()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
  })

  test('a failed save creates nothing, and the retry is the same single request', async () => {
    // The reservation and its products are one atomic request, so there is no
    // half-saved reservation for the retry to duplicate: the second attempt is
    // the first attempt again, not a second parent for the same products.
    let attempts = 0
    api.post(RESERVATIONS, () => {
      attempts += 1
      return attempts === 1
        ? HttpResponse.json({ detail: 'boom' }, { status: 500 })
        : fixtureFor(vSupplierReservation, { id: 100 })
    })

    const wrapper = await readyToCreate()
    await pickSupplier(wrapper)
    wrapper.vm.supplierReservation.materials = [{ material: 10, amount: 1 }]

    await wrapper.vm.submitForm()

    expect(routerGo()).not.toHaveBeenCalled()
    expect(toastTitles()).toEqual(['Error'])
    expect(writes().map((request) => request.path)).toEqual([RESERVATIONS])

    await wrapper.vm.submitForm()

    expect(writes().map((request) => request.path)).toEqual([RESERVATIONS, RESERVATIONS])
    expect(writes()[1].body).toEqual(writes()[0].body)
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('shows a single toast for the reservation and none per product', async () => {
    const wrapper = await readyToCreate()

    await pickSupplier(wrapper)
    toastCreate.mockClear()
    wrapper.vm.supplierReservation.materials = [
      { material: 10, amount: 1 },
      { material: 11, amount: 2 },
    ]

    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Created'])
  })
})

describe('SupplierReservationForm - update', () => {
  async function readyEdit() {
    const wrapper = mount({ pk: 42 })
    await vi.waitFor(() => expect(wrapper.vm.supplierReservation.id).toBe(42))
    await settle()

    return wrapper
  }

  test('sends one request carrying the reservation and its whole product list', async () => {
    const wrapper = await readyEdit()

    // id 7 is stored, so the row updates it; the row without an id is created;
    // the stored row the list leaves out is what the endpoint deletes.
    wrapper.vm.supplierReservation.materials = [
      { id: 7, material: 10, amount: 3 },
      { material: 11, amount: 4 },
    ]

    await wrapper.vm.submitForm()

    expect(writes()).toEqual([
      {
        method: 'patch',
        path: '/api/inventory/supplier-reservation/42/with-materials/',
        query: {},
        body: reservationBody([
          { id: 7, material: 10, amount: 3, remarks: null },
          { material: 11, amount: 4, remarks: null },
        ]),
      },
    ])
  })

  test('deletes a removed product by leaving it out, not with a request of its own', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.supplierReservation.materials = [{ id: 7, material: 10, amount: 3 }]
    wrapper.vm.deleteMaterial(0)
    await wrapper.vm.submitForm()

    expect(writes()[0].body.materials).toEqual([])
    expect(api.requests().map((request) => request.method)).not.toContain('delete')
  })

  test('does not navigate when the save fails', async () => {
    api.patch(RESERVATION, () => HttpResponse.json({ detail: 'boom' }, { status: 500 }))

    const wrapper = await readyEdit()
    wrapper.vm.supplierReservation.materials = [{ id: 7, material: 10, amount: 3 }]

    await wrapper.vm.submitForm()

    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(toastTitles()).toEqual(['Error'])
  })

  // The per-material toasts are gone with the per-material requests: there is
  // one save and one outcome to report for it. The copy is the legacy copy.
  test('shows the reservation toast once, whatever the product list holds', async () => {
    const wrapper = await readyEdit()
    toastCreate.mockClear()

    wrapper.vm.supplierReservation.materials = [
      { id: 7, material: 10, amount: 3 },
      { material: 11, amount: 4 },
    ]

    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Updated'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })
})

describe('SupplierReservationForm - product list editing', () => {
  test('deleteMaterial removes the product from the list', async () => {
    const wrapper = await readyToCreate()

    wrapper.vm.supplierReservation.materials = [{ id: 1, material: 10 }, { id: 2, material: 11 }]

    wrapper.vm.deleteMaterial(0)

    expect(wrapper.vm.supplierReservation.materials.map((m) => m.id)).toEqual([2])
  })

  test('doEditMaterial replaces the product at the edited index', async () => {
    const wrapper = await readyToCreate()

    wrapper.vm.supplierReservation.materials = [{ id: 1, amount: 1 }, { id: 2, amount: 2 }]
    wrapper.vm.editMaterial({ id: 1, amount: 99 }, 0)
    wrapper.vm.doEditMaterial()

    expect(wrapper.vm.supplierReservation.materials[0].amount).toBe(99)
    expect(wrapper.vm.isEditMaterial).toBe(false)
    expect(wrapper.vm.editIndex).toBeNull()
  })

  test('selectSupplier stores the supplier and refreshes the product list', async () => {
    const wrapper = await readyToCreate()

    await pickSupplier(wrapper)

    expect(wrapper.vm.supplierReservation.supplier).toBe(3)
    expect(wrapper.vm.selectedSupplier).toMatchObject({ id: 3, name: 'ACME' })
    // The product list is scoped to the chosen supplier.
    expect(api.requests().filter((request) => request.path === MATERIAL_LIST)).toEqual([
      {
        method: 'get',
        path: MATERIAL_LIST,
        query: { page: '1', supplier_relation: '3' },
      },
    ])
  })
})

// The add-material guard. Mutation testing showed this was entirely unpinned:
// isMaterialValid could be replaced by `true`, by `false`, or have its `&&`
// turned into `||`, and every existing test still passed. The guard decides
// whether a product may be added to the collection at all, so it is squarely
// part of what the save refactor touches.
describe('SupplierReservationForm - the add-material guard', () => {
  async function readyToAdd() {
    const wrapper = await readyToCreate()
    await pickSupplier(wrapper)

    return wrapper
  }

  async function setMaterial(wrapper, fields) {
    Object.assign(wrapper.vm.material, fields)
    await wrapper.vm.$nextTick()
  }

  test('adds the product when both fields are valid', async () => {
    const wrapper = await readyToAdd()
    await setMaterial(wrapper, { material: 10, amount: 2 })

    wrapper.vm.addMaterial()

    expect(wrapper.vm.supplierReservation.materials).toHaveLength(1)
    expect(wrapper.vm.supplierReservation.materials[0]).toMatchObject({
      material: 10,
      amount: 2,
    })
  })

  // Exactly one of the two checks fails here, which is what distinguishes
  // `&&` from `||` in the guard.
  test('refuses to add when no product has been chosen', async () => {
    const wrapper = await readyToAdd()
    await setMaterial(wrapper, { material: null, amount: 2 })

    wrapper.vm.addMaterial()

    expect(wrapper.vm.supplierReservation.materials).toHaveLength(0)
  })

  // Pins greaterThanZero: zero is not a valid amount, so `>` may not become `>=`.
  test('refuses to add an amount of zero', async () => {
    const wrapper = await readyToAdd()
    await setMaterial(wrapper, { material: 10, amount: 0 })

    wrapper.vm.addMaterial()

    expect(wrapper.vm.supplierReservation.materials).toHaveLength(0)
  })

  test('clears the draft product after a successful add', async () => {
    const wrapper = await readyToAdd()
    await setMaterial(wrapper, { material: 10, amount: 2 })

    wrapper.vm.addMaterial()

    expect(wrapper.vm.material.material).toBeFalsy()
  })
})

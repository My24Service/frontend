import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { HttpResponse } from 'msw'
import {
  vMaterial,
  vSupplier,
  vSupplierReservation,
  vSupplierReservationMaterial,
} from '@/api/valibot.gen'
import {
  SupplierReservationForm,
  SupplierReservationList,
  SupplierReservationView,
} from '@/features/inventory/reservation'
import { fixtureFor, paginated } from '../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../support/api-seam/index.js'
import { mountForm, mountListView, routerGo, toasts } from '../support/form-harness.js'
import { serverError } from '../support/list-harness.js'
import {
  SUPPLIER,
  addProduct,
  button,
  deleteStagedRow,
  editStagedRow,
  materialRow,
  multiselectStub,
  picker,
  searchProducts,
  stagedRows,
  supplierRow,
} from '../support/inventory-material-rows.js'
import { modal } from '../support/modal.js'

const api = installApiSeam()

const blank = { template: '<div />' }
const routes = [
  { name: 'supplier-reservation-add', path: '/inventory/supplier-reservations/form', component: blank },
  { name: 'supplier-reservation-view', path: '/inventory/supplier-reservations/view/:pk', component: blank },
  { name: 'supplier-reservation-list', path: '/inventory/supplier-reservations', component: blank },
  { name: 'supplier-reservation-edit', path: '/inventory/supplier-reservations/form/:pk', component: blank },
]

function reservationMaterial(id, material, name, amount, remarks) {
  return fixtureFor(vSupplierReservationMaterial, {
    id,
    reservation: 42,
    material,
    amount,
    remarks,
    material_view: fixtureFor(vMaterial, { id: material, name }),
  })
}

function reservation(overrides = {}) {
  return fixtureFor(vSupplierReservation, {
    id: 42,
    supplier: 3,
    supplier_view: fixtureFor(vSupplier, { ...SUPPLIER, identifier: 'SUP-1' }),
    created: '01/03/2026',
    modified: '02/03/2026',
    materials: [
      reservationMaterial(7, 10, 'Widget', 3, 'first'),
      reservationMaterial(8, 11, 'Gadget', 5, null),
    ],
    ...overrides,
  })
}

const normalise = (html) => html
  .replace(/ data-v-[0-9a-f]+=""/g, '')
  .replace(/ id="[^"]*"/g, '')
  .replace(/ for="[^"]*"/g, '')
  .replace(/ aria-labelledby="[^"]*"/g, '')


const LIST = '/api/inventory/supplier-reservation/'
const RECORD = '/api/inventory/supplier-reservation/{id}/'
const SAVE_CREATE = '/api/inventory/supplier-reservation/with-materials/'
const SAVE_UPDATE = '/api/inventory/supplier-reservation/{id}/with-materials/'
const SUPPLIERS = '/api/inventory/supplier/autocomplete/'
const MATERIALS = '/api/inventory/material/'

const bodies = () => toasts().map((toast) => toast.body)
const titles = () => toasts().map((toast) => toast.title)
const writes = () => api.requests().filter((request) => request.method !== 'get')

beforeEach(() => {
  api.get(LIST, () => paginated([reservation()], { count: 1 }))
  api.get(RECORD, () => reservation())
  api.get(SUPPLIERS, () => [supplierRow()])
  api.get(MATERIALS, () => paginated([fixtureFor(vMaterial, { id: 10, name: 'Widget', identifier: 'MAT-1' })]))
  // The parent comes back as the backend builds it: the reservation it stored,
  // with the materials list it was handed.
  api.post(SAVE_CREATE, ({ body }) => reservation({ id: 100, supplier: body.supplier, materials: [] }))
  api.patch(SAVE_UPDATE, ({ body }) => reservation({ supplier: body.supplier, materials: [] }))
  api.delete(RECORD, noContent)
})

afterEach(() => window.history.replaceState(null, '', '/'))

async function mountView(component = SupplierReservationView) {
  const wrapper = mountForm(component, { deep: true, routes, props: { pk: '42' } })
  await settle()
  return wrapper
}

const cells = (wrapper, tableId) => wrapper.findAll(`#${tableId} tbody tr`).map((tr) => tr.findAll('td').map((td) => td.text()))

describe('SupplierReservationView', () => {
  test('renders the legacy view\'s markup', async () => {
    // The snapshot was taken only after this view's HTML was proven identical to
    // the legacy SupplierReservationView's (since deleted), for this same
    // fixture, apart from the one ledger fix: the products are sorted by name,
    // where the legacy's string `sort-by` made the table throw.
    expect(normalise((await mountView()).html())).toMatchSnapshot()
  })

  test('reads the reservation by id', async () => {
    await mountView()

    expect(api.requests()).toEqual([{ method: 'get', path: '/api/inventory/supplier-reservation/42/', query: {} }])
  })

  test('shows the supplier, its details and the dates', async () => {
    const wrapper = await mountView()

    const text = wrapper.text()
    for (const shown of ['ACME', 'Street 1', 'NL-', '1000AA Amsterdam', 'Jan', '020', '06', '01/03/2026', '02/03/2026']) {
      expect(text).toContain(shown)
    }
    expect(wrapper.get('a[href="mailto:a@b.nl"]').text()).toBe('a@b.nl')
  })

  // REGRESSION: `sort-by` was given as a string, which the table component
  // throws on while setting up, so a reservation with products rendered no
  // detail at all.
  test('renders the products sorted by name', async () => {
    const wrapper = await mountView()

    expect(cells(wrapper, 'reservation-materials-table')).toEqual([
      ['Gadget', '5', ''],
      ['Widget', '3', 'first'],
    ])
  })

  test('a reservation without products shows no products section', async () => {
    api.get(RECORD, () => reservation({ materials: [] }))
    const wrapper = await mountView()

    expect(wrapper.findAll('h4')).toHaveLength(0)
  })

  test('the edit link goes to the reservation\'s edit route', async () => {
    const wrapper = await mountView()

    expect(wrapper.get('a.btn-primary').attributes('href')).toBe('/inventory/supplier-reservations/form/42')
  })

  test('Back returns to the previous page', async () => {
    const wrapper = await mountView()

    await button(wrapper, 'Back').trigger('click')

    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a failed read tells the user', async () => {
    api.get(RECORD, serverError)
    await mountView()

    expect(bodies()).toContain('Error fetching reservation')
  })
})

describe('SupplierReservationList', () => {
  async function mountReservations() {
    const wrapper = await mountListView(SupplierReservationList, { deep: true, routes })
    await settle()
    return wrapper
  }
  const lists = () => api.requests().filter((request) => request.method === 'get' && request.path === LIST)

  test('loads page one and renders the reservation and its created date', async () => {
    const wrapper = await mountReservations()

    expect(lists()[0]).toMatchObject({ query: { page: '1', page_size: '20' } })
    expect(wrapper.get('h3').text()).toContain('Reservations')
    expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual(['Reservation', 'Materials', 'Created', ''])
    expect(wrapper.get('tbody').text()).toContain('01/03/2026')
  })

  test('the first column links to the reservation, named after its supplier', async () => {
    const wrapper = await mountReservations()

    const link = wrapper.get('tbody a')
    expect(link.text()).toBe('42. ACME, Amsterdam')
    expect(link.attributes('href')).toBe('/inventory/supplier-reservations/view/42')
  })

  test('the materials cell summarises the first product, then "and N more"', async () => {
    const wrapper = await mountReservations()

    const cell = wrapper.findAll('tbody td')[1]
    expect(cell.text().replace(/\s+/g, ' ')).toBe('2 materials — 3 Widget and 1 more')
    expect(cell.get('span').attributes('title')).toBe('2 materials')
  })

  test('a single product reads "1 material" and no "and N more"', async () => {
    api.get(LIST, () => paginated([reservation({ materials: [reservationMaterial(7, 10, 'Widget', 3, null)] })]))
    const wrapper = await mountReservations()

    expect(wrapper.findAll('tbody td')[1].text().replace(/\s+/g, ' ')).toBe('1 material — 3 Widget')
  })

  test('a reservation with no products has an empty materials cell', async () => {
    api.get(LIST, () => paginated([reservation({ materials: [] })]))
    const wrapper = await mountReservations()

    expect(wrapper.findAll('tbody td')[1].text()).toBe('')
  })

  test('the edit action goes to the edit route', async () => {
    const wrapper = await mountReservations()

    expect(wrapper.get('tbody a[title="Edit"]').attributes('href')).toBe('/inventory/supplier-reservations/form/42')
  })

  test('a load failure tells the user', async () => {
    api.get(LIST, serverError)
    await mountReservations()

    expect(bodies()).toContain('Error loading reservations')
  })

  // REGRESSION: the legacy screen toasted 'Entry Reservation been deleted'.
  test('delete confirms, sends the row id, refetches and says the reservation was deleted', async () => {
    const wrapper = await mountReservations()

    await wrapper.get('tbody button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-supplier-reservation-modal').ok()
    await settle()

    expect(writes()).toEqual([{ method: 'delete', path: '/api/inventory/supplier-reservation/42/', query: {} }])
    expect(bodies()).toContain('Reservation has been deleted')
    expect(lists()).toHaveLength(2)
  })

  test('a failed delete reports it', async () => {
    api.delete(RECORD, serverError)
    const wrapper = await mountReservations()

    await wrapper.get('tbody button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-supplier-reservation-modal').ok()
    await settle()

    expect(bodies()).toContain('Error deleting reservation')
  })
})

describe('SupplierReservationForm', () => {
  function mountReservationForm(props = {}, options = {}) {
    return mountForm(SupplierReservationForm, {
      deep: true,
      routes,
      props,
      stubs: { VueMultiselect: multiselectStub },
      ...options,
    })
  }

  /** Pick a supplier the way the UI does: type, then select the row. */
  async function pickSupplier(wrapper, row = supplierRow()) {
    picker(wrapper, 'supplier-reservation-supplier-search').vm.$emit('select', row)
    await settle()
  }

  async function readyToCreate() {
    const wrapper = mountReservationForm()
    await settle()
    return wrapper
  }

  async function readyToEdit() {
    const wrapper = mountReservationForm({ pk: 42 })
    await settle()
    return wrapper
  }

  const submit = (wrapper) => button(wrapper, 'Submit').trigger('click')

  describe('create', () => {
    test('sends one request carrying the reservation and its whole product list', async () => {
      const wrapper = await readyToCreate()

      await pickSupplier(wrapper)
      await addProduct(wrapper, { id: 10, name: 'Widget' }, 2, 'first')
      await addProduct(wrapper, { id: 11, name: 'Gadget' }, 5, 'second')
      await submit(wrapper)
      await settle()

      expect(writes()).toEqual([
        {
          method: 'post',
          path: SAVE_CREATE,
          query: {},
          body: {
            supplier: 3,
            materials: [
              { material: 10, amount: 2, remarks: 'first' },
              { material: 11, amount: 5, remarks: 'second' },
            ],
          },
        },
      ])
    })

    test('sends an amount the request declares, not the string the input binds', async () => {
      const wrapper = await readyToCreate()

      await pickSupplier(wrapper)
      await addProduct(wrapper, { id: 10, name: 'Widget' }, '2')
      await submit(wrapper)
      await settle()

      expect(writes()[0].body.materials).toEqual([{ material: 10, amount: 2, remarks: '' }])
    })

    // REGRESSION: the editor checked only the product and the amount, so a
    // remark over the request's 255 characters was staged, the save's parse
    // threw, and Submit did nothing at all. The row is now refused in the panel.
    test('a product remark over 255 characters is refused in the panel, not at the save', async () => {
      const wrapper = await readyToCreate()

      await pickSupplier(wrapper)
      await addProduct(wrapper, { id: 10, name: 'Widget' }, 2, 'x'.repeat(256))

      expect(stagedRows(wrapper)).toEqual([])
      expect(wrapper.findAll('.material-rows .invalid-feedback.d-block').map((feedback) => feedback.text())).toEqual([
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

    test('sends nothing when the supplier is missing, and says so under the read-only details', async () => {
      const wrapper = await readyToCreate()

      await submit(wrapper)
      await settle()

      expect(writes()).toEqual([])
      expect(wrapper.findAll('.invalid-feedback.d-block').map((feedback) => feedback.text())).toEqual(
        Array(4).fill('Please select a supplier'),
      )
    })

    test('navigates back and re-enables the button on success', async () => {
      const wrapper = await readyToCreate()

      await pickSupplier(wrapper)
      await submit(wrapper)
      await settle()

      expect(routerGo()).toHaveBeenCalledWith(-1)
      expect(button(wrapper, 'Submit').attributes('disabled')).toBeUndefined()
    })

    test('a failed save creates nothing, and the retry is the same single request', async () => {
      // The reservation and its products are one atomic request, so there is no
      // half-saved reservation for the retry to duplicate.
      let attempts = 0
      api.post(SAVE_CREATE, () => {
        attempts += 1
        return attempts === 1
          ? HttpResponse.json({ detail: 'boom' }, { status: 500 })
          : reservation({ id: 100, materials: [] })
      })
      const wrapper = await readyToCreate()
      await pickSupplier(wrapper)
      await addProduct(wrapper, { id: 10, name: 'Widget' }, 1)

      await submit(wrapper)
      await settle()

      expect(routerGo()).not.toHaveBeenCalled()
      expect(titles()).toEqual(['Error'])
      expect(bodies()).toEqual(['Error creating reservation'])
      expect(button(wrapper, 'Submit').attributes('disabled')).toBeUndefined()
      expect(writes().map((request) => request.path)).toEqual([SAVE_CREATE])

      await submit(wrapper)
      await settle()

      expect(writes().map((request) => request.path)).toEqual([SAVE_CREATE, SAVE_CREATE])
      expect(writes()[1].body).toEqual(writes()[0].body)
      expect(routerGo()).toHaveBeenCalledWith(-1)
    })

    test('shows a single toast for the reservation and none per product', async () => {
      const wrapper = await readyToCreate()

      await pickSupplier(wrapper)
      await addProduct(wrapper, { id: 10, name: 'Widget' }, 1)
      await addProduct(wrapper, { id: 11, name: 'Gadget' }, 2)
      await submit(wrapper)
      await settle()

      expect(titles()).toEqual(['Created'])
      expect(bodies()).toEqual(['Reservation has been created'])
    })
  })

  describe('update', () => {
    test('reads the reservation and shows its supplier and stored products', async () => {
      const wrapper = await readyToEdit()

      expect(wrapper.get('#supplier-reservation-supplier-name').element.value).toBe('ACME')
      expect(wrapper.get('#supplier-reservation-supplier-address').element.value).toBe('Street 1')
      expect(wrapper.get('#supplier-reservation-supplier-city').element.value).toBe('Amsterdam')
      expect(wrapper.get('#supplier-reservation-supplier-email').element.value).toBe('a@b.nl')
      expect(stagedRows(wrapper)).toEqual([['Widget', '3', 'first'], ['Gadget', '5', '']])
      expect(wrapper.text()).toContain('42')
      expect(wrapper.text()).toContain('edit')
    })

    test('sends one request carrying the whole product list', async () => {
      const wrapper = await readyToEdit()

      // Row 7 is stored, so it updates; the row without an id is created; a
      // stored row the list leaves out is what the endpoint deletes.
      await editStagedRow(wrapper, 0)
      await wrapper.get('#material-rows-amount').setValue('9')
      await button(wrapper, 'Edit product').trigger('click')
      await settle()
      await addProduct(wrapper, { id: 12, name: 'Sprocket' }, 4)
      await submit(wrapper)
      await settle()

      expect(writes()).toEqual([
        {
          method: 'patch',
          path: '/api/inventory/supplier-reservation/42/with-materials/',
          query: {},
          body: {
            supplier: 3,
            materials: [
              { id: 7, material: 10, amount: 9, remarks: 'first' },
              { id: 8, material: 11, amount: 5, remarks: null },
              { material: 12, amount: 4, remarks: '' },
            ],
          },
        },
      ])
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
      api.patch(SAVE_UPDATE, () => HttpResponse.json({ detail: 'boom' }, { status: 500 }))
      const wrapper = await readyToEdit()

      await submit(wrapper)
      await settle()

      expect(routerGo()).not.toHaveBeenCalled()
      expect(button(wrapper, 'Submit').attributes('disabled')).toBeUndefined()
      expect(titles()).toEqual(['Error'])
      expect(bodies()).toEqual(['Error updating reservation'])
    })

    test('shows the reservation toast once, whatever the product list holds', async () => {
      const wrapper = await readyToEdit()

      await submit(wrapper)
      await settle()

      expect(titles()).toEqual(['Updated'])
      expect(bodies()).toEqual(['Reservation has been updated'])
      expect(routerGo()).toHaveBeenCalledWith(-1)
    })

    test('a failed read tells the user', async () => {
      api.get(RECORD, serverError)
      await readyToEdit()

      expect(bodies()).toContain('Error fetching reservation')
    })
  })

  describe('the supplier', () => {
    test('picking one shows its details and offers its products', async () => {
      const wrapper = await readyToCreate()
      expect(wrapper.find('.material-rows').exists()).toBe(false)
      expect(wrapper.text()).toContain('Select a supplier')

      await pickSupplier(wrapper)

      expect(wrapper.get('#supplier-reservation-supplier-name').element.value).toBe('ACME')
      expect(wrapper.get('#supplier-reservation-supplier-email').element.value).toBe('a@b.nl')
      expect(wrapper.find('.material-rows').exists()).toBe(true)
    })

    test('the supplier search asks the autocomplete endpoint for what was typed', async () => {
      const wrapper = await readyToCreate()

      picker(wrapper, 'supplier-reservation-supplier-search').vm.$emit('search-change', 'acm')
      // The search is debounced; zero in specs.
      await settle()

      expect(api.requests()).toEqual([{ method: 'get', path: SUPPLIERS, query: { q: 'acm' } }])
      expect(picker(wrapper, 'supplier-reservation-supplier-search').props('options')).toHaveLength(1)
    })

    // The reservation searches the supplier's catalogue, as the legacy form did:
    // the autocomplete the order form uses answers only materials with a price
    // row for this year, and would hide the rest of the catalogue.
    test('the product search is scoped to the chosen supplier', async () => {
      const wrapper = await readyToCreate()
      await pickSupplier(wrapper)

      await searchProducts(wrapper, 'wid')

      expect(api.requests().filter((request) => request.path === MATERIALS)).toEqual([
        { method: 'get', path: MATERIALS, query: { q: 'wid', supplier_relation: '3', page: '1' } },
      ])
    })

    // REGRESSION: the legacy form kept the products of the previous supplier
    // when another was picked, so a save sent products the new supplier does not
    // have. (The purchase order form has always cleared them.)
    test('picking another supplier clears the products staged for the first', async () => {
      const wrapper = await readyToEdit()
      expect(stagedRows(wrapper)).toHaveLength(2)

      await pickSupplier(wrapper, supplierRow({ id: 4, name: 'Other BV' }))
      expect(stagedRows(wrapper)).toEqual([])

      await submit(wrapper)
      await settle()

      expect(writes()[0].body).toEqual({ supplier: 4, materials: [] })
    })
  })
})

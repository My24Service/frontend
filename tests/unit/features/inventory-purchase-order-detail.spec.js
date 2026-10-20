import { beforeEach, describe, expect, test } from 'vitest'
import {
  vMaterial,
  vPurchaseOrderDetail,
  vPurchaseOrderEntry,
  vPurchaseOrderMaterial,
  vPurchaseOrderStatus,
  vSupplierReservationMaterial,
} from '@/api/valibot.gen'
import { PurchaseOrderView } from '@/features/inventory'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../support/form-harness.js'
import { serverError } from '../support/list-harness.js'

const api = installApiSeam()
const endpoint = '/api/inventory/purchaseorder/{id}/'

const blank = { template: '<div />' }
const routes = [
  { name: 'purchaseorder-edit', path: '/inventory/purchaseorders/form/:pk', component: blank },
]

const material = (name) => fixtureFor(vMaterial, { name })

function order(overrides = {}) {
  return fixtureFor(vPurchaseOrderDetail, {
    id: 42,
    supplier: 3,
    purchase_order_id: 'PO-0042',
    order_name: 'ACME',
    order_address: 'Street 1',
    order_postal: '1000AA',
    order_city: 'Amsterdam',
    order_country_code: 'NL',
    order_contact: 'Jan',
    order_tel: '020',
    order_mobile: '06',
    order_email: 'a@b.nl',
    order_reference: 'REF-1',
    supplier_remarks: 'Handle with care',
    expected_entry_date: '04/03/2026',
    expected_entry_date_iso: '2026-03-04',
    statuses: [
      fixtureFor(vPurchaseOrderStatus, { id: 1, purchase_order: 42, status: 'Ordered', created: '01/03/2026' }),
      fixtureFor(vPurchaseOrderStatus, { id: 2, purchase_order: 42, status: 'Shipped', created: '02/03/2026' }),
    ],
    materials: [
      fixtureFor(vPurchaseOrderMaterial, { id: 1, material: 10, amount: 3, remarks: 'first', material_view: material('Widget') }),
      fixtureFor(vPurchaseOrderMaterial, { id: 2, material: 11, amount: 5, remarks: null, material_view: material('Gadget') }),
    ],
    reservation_materials: [
      fixtureFor(vSupplierReservationMaterial, { id: 7, material: 10, amount: 2, remarks: 'reserved', material_view: material('Widget') }),
    ],
    entries: [
      fixtureFor(vPurchaseOrderEntry, { id: 9, material_name: 'Widget', amount: 1, entry_date: '03/03/2026' }),
    ],
    ...overrides,
  })
}

beforeEach(() => {
  api.get(endpoint, () => order())
})

async function mountView(props = { pk: '42' }) {
  const wrapper = mountForm(PurchaseOrderView, { deep: true, routes, props })
  await settle()
  return wrapper
}

const normalise = (html) => html
  .replace(/ data-v-[0-9a-f]+=""/g, '')
  .replace(/ id="[^"]*"/g, '')
  .replace(/ for="[^"]*"/g, '')
  .replace(/ aria-labelledby="[^"]*"/g, '')

const rows = (wrapper, tableId) => wrapper.findAll(`#${tableId} tbody tr`).map((tr) => tr.findAll('td').map((td) => td.text()))

test('renders the legacy view\'s markup', async () => {
  // The snapshot was taken only after this view's HTML was proven identical to
  // the legacy PurchaseOrderView's (since deleted), for this same fixture, apart
  // from the two ledger fixes: the expected entry date reads as the tenant's
  // display string where the legacy showed a JS Date's toString, and the
  // products table is sorted by name where the legacy's sort-by threw.
  const current = normalise((await mountView()).html())
  expect(current).toMatchSnapshot()
})

test('reads the order by id', async () => {
  await mountView()

  expect(api.requests()).toEqual([{ method: 'get', path: '/api/inventory/purchaseorder/42/', query: {} }])
})

test('shows the order, its supplier details and its history', async () => {
  const wrapper = await mountView()

  const text = wrapper.text()
  expect(wrapper.get('h3').text()).toContain('PO-0042')
  expect(wrapper.get('h3').text()).toContain('ACME')
  for (const shown of ['Street 1', 'NL-', '1000AA Amsterdam', 'Jan', '020', '06', 'REF-1', 'Handle with care']) {
    expect(text).toContain(shown)
  }
  expect(wrapper.get('a[href="mailto:a@b.nl"]').text()).toBe('a@b.nl')
  expect(wrapper.findAll('ul.listing li').map((li) => li.text())).toEqual([
    '01/03/2026 Ordered',
    '02/03/2026 Shipped',
  ])
})

// REGRESSION: the legacy detail() replaced the display string with a Date, and
// the page printed its toString ('Wed Mar 04 2026 00:00:00 GMT+0100 ...').
test('shows the expected entry date as the tenant\'s display string', async () => {
  const wrapper = await mountView()

  const dt = wrapper.findAll('dt').find((node) => node.text() === 'Expected entry date')
  expect(dt.element.nextElementSibling.textContent.trim()).toBe('04/03/2026')
})

// REGRESSION: the tables were given `sort-by` as a string, which the table
// component throws on while setting up, so an order with products rendered no
// view at all.
test('renders the products, the reserved products and the entries, sorted by name', async () => {
  const wrapper = await mountView()

  expect(rows(wrapper, 'purchaseorder-materials-table')).toEqual([
    ['Gadget', '5', ''],
    ['Widget', '3', 'first'],
  ])
  expect(rows(wrapper, 'purchaseorder-reservation_materials-table')).toEqual([['Widget', '2', 'reserved']])
  expect(rows(wrapper, 'purchaseorder-entries-table')).toEqual([['Widget', '1', '03/03/2026']])
})

test('an order without products, reserved products or entries shows none of those sections', async () => {
  api.get(endpoint, () => order({ materials: [], reservation_materials: null, entries: [] }))
  const wrapper = await mountView()

  expect(wrapper.findAll('h6').map((h) => h.text())).toEqual(['History'])
})

test('the edit link goes to the order\'s edit route', async () => {
  const wrapper = await mountView()

  expect(wrapper.get('a.btn[href]').attributes('href')).toBe('/inventory/purchaseorders/form/42')
})

test('Back returns to the previous page', async () => {
  const wrapper = await mountView()

  await wrapper.findAll('button').find((button) => button.text() === 'Back').trigger('click')

  expect(routerGo()).toHaveBeenCalledWith(-1)
})

test('a failed read tells the user', async () => {
  api.get(endpoint, serverError)
  await mountView()

  expect(toasts().map((toast) => toast.body)).toContain('Error fetching purchase order')
})

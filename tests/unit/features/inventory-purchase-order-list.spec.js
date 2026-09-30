import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { vPurchaseOrderList, vPurchaseOrderStatus } from '@/api/valibot.gen'
import { PurchaseOrderList } from '@/features/inventory'
import { fixtureFor, paginated } from '../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../support/api-seam/index.js'
import { mountListView, toasts } from '../support/form-harness.js'
import { serverError } from '../support/list-harness.js'
import { modal } from '../support/modal.js'

const api = installApiSeam()
const endpoint = '/api/inventory/purchaseorder/'
const statusEndpoint = '/api/inventory/purchaseorder-status/'
const statusModal = 'purchaseorder-change-status-modal'

const blank = { template: '<div />' }
const routes = [
  { name: 'purchaseorder-add', path: '/inventory/purchaseorders/form', component: blank },
  { name: 'purchaseorder-edit', path: '/inventory/purchaseorders/form/:pk', component: blank },
  { name: 'purchaseorder-view', path: '/inventory/purchaseorders/view/:pk', component: blank },
  { name: 'supplier-reservation-view', path: '/inventory/supplier-reservations/view/:pk', component: blank },
]

function order(overrides = {}) {
  return fixtureFor(vPurchaseOrderList, {
    id: 5,
    purchase_order_id: 'PO-0005',
    order_name: 'ACME',
    supplier_reservation: null,
    last_status: 'Ordered',
    last_status_full: 'Ordered on 01/03/2026',
    expected_entry_date: '04/03/2026',
    created: '01/03/2026',
    total_entries: 1,
    total_materials: 4,
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const lists = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)
const writes = () => api.requests().filter((request) => request.method !== 'get')

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([order()], { count: 1 }))
  api.delete(endpoint + '{id}/', noContent)
  api.post(statusEndpoint, ({ body }) => fixtureFor(vPurchaseOrderStatus, { id: 90, ...body }))
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountOrders(options = {}) {
  const wrapper = await mountListView(PurchaseOrderList, { deep: true, routes, ...options })
  await settle()
  return wrapper
}

const rowAction = (wrapper, title) => wrapper.get(`tbody button[title="${title}"], tbody a[title="${title}"]`)

describe('PurchaseOrderList', () => {
  test('loads page one and renders the order, status and dates', async () => {
    const wrapper = await mountOrders()

    expect(lists()[0]).toMatchObject({ path: endpoint, query: { page: '1', page_size: '20' } })
    const body = wrapper.get('tbody').text()
    expect(body).toContain('PO-0005 ACME')
    expect(body).toContain('Ordered')
    expect(body).toContain('04/03/2026')
    expect(body).toContain('01/03/2026')
    expect(wrapper.get('h3').text()).toContain('Purchase orders')
    expect(wrapper.get('small[title="Ordered on 01/03/2026"]').text()).toBe('Ordered')
  })

  test('the order cell links to the order view', async () => {
    const wrapper = await mountOrders()

    expect(wrapper.get('tbody a').attributes('href')).toBe('/inventory/purchaseorders/view/5')
  })

  // The legacy field list opened with a bare 'index' field, which rendered a
  // column with a blank header and blank cells. The headers now are exactly the
  // ones the screen names.
  test('has no blank leading column', async () => {
    const wrapper = await mountOrders()

    const headers = wrapper.findAll('thead th').map((th) => th.text())
    expect(headers).toEqual([
      'Order',
      'Reservation',
      'Status',
      'Expected entry date',
      'Created',
      '# entries / # products',
      '',
    ])
    expect(wrapper.findAll('tbody tr')[0].findAll('td')).toHaveLength(headers.length)
  })

  test('an order without a reservation shows a dash', async () => {
    const wrapper = await mountOrders()

    const cell = wrapper.findAll('tbody td')[1]
    expect(cell.text()).toBe('—')
    expect(cell.findAll('a')).toHaveLength(0)
  })

  test('an order made from a reservation links to it', async () => {
    api.get(endpoint, () => paginated([order({ supplier_reservation: 12 })]))
    const wrapper = await mountOrders()

    const link = wrapper.findAll('tbody td')[1].get('a')
    expect(link.text()).toBe('12')
    expect(link.attributes('href')).toBe('/inventory/supplier-reservations/view/12')
  })

  test('the progress column shows entries against products', async () => {
    const wrapper = await mountOrders()

    expect(wrapper.get('tbody .progress-bar').attributes('style')).toContain('width: 25%')
    expect(wrapper.get('tbody small.dimmed').text()).toBe('1 / 4')
  })

  test('an order with no entries yet reads 0 entries and an empty bar', async () => {
    api.get(endpoint, () => paginated([order({ total_entries: null, total_materials: 3 })]))
    const wrapper = await mountOrders()

    expect(wrapper.get('tbody small.dimmed').text()).toBe('0 / 3')
    expect(wrapper.get('tbody .progress-bar').attributes('style') ?? '').not.toContain('width: 100%')
  })

  test('the edit action goes to the edit route', async () => {
    const wrapper = await mountOrders()

    expect(rowAction(wrapper, 'Edit').attributes('href')).toBe('/inventory/purchaseorders/form/5')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    await mountOrders()

    expect(bodies()).toContain('Error loading purchase orders')
  })

  test('a search term is debounced onto the wire', async () => {
    const wrapper = await mountOrders()

    await wrapper.get('input[aria-label="Search purchase orders"]').setValue('acme')
    await settle()

    expect(lists().at(-1).query).toMatchObject({ q: 'acme', page: '1' })
  })

  test('the columns send no ordering the API does not declare', async () => {
    const wrapper = await mountOrders()

    expect(wrapper.findAll('thead th[aria-label^="Sort by"]')).toHaveLength(0)
  })
})

describe('PurchaseOrderList delete', () => {
  test('confirms, sends the row id and refetches', async () => {
    const wrapper = await mountOrders()

    await rowAction(wrapper, 'Delete').trigger('click')
    await settle()
    modal('delete-purchaseorder-modal').ok()
    await settle()

    expect(writes()).toEqual([{ method: 'delete', path: endpoint + '5/', query: {} }])
    expect(bodies()).toContain('Purchase order has been deleted')
    expect(lists()).toHaveLength(2)
  })

  test('a failed delete reports it', async () => {
    api.delete(endpoint + '{id}/', serverError)
    const wrapper = await mountOrders()

    await rowAction(wrapper, 'Delete').trigger('click')
    await settle()
    modal('delete-purchaseorder-modal').ok()
    await settle()

    expect(bodies()).toContain('Error deleting purchase order')
  })
})

describe('PurchaseOrderList add status', () => {
  async function openStatus(wrapper, text) {
    await rowAction(wrapper, 'Change status').trigger('click')
    await settle()
    modal(statusModal).typeInto('#change-status-status', text)
  }

  // REGRESSION: the legacy modal posted `{purchase_order, status}` to the
  // purchase order collection, which tries to create a purchase order. Fails
  // against the legacy screen, whose request went to `endpoint`.
  test('posts the status to the status endpoint, for the order the row belongs to', async () => {
    const wrapper = await mountOrders()

    await openStatus(wrapper, 'Delivered')
    modal(statusModal).ok()
    await settle()

    expect(writes()).toEqual([
      { method: 'post', path: statusEndpoint, query: {}, body: { purchase_order: 5, status: 'Delivered' } },
    ])
    expect(bodies()).toContain('Status has been created')
  })

  test('closes the modal and refetches the orders behind it', async () => {
    const wrapper = await mountOrders()

    await openStatus(wrapper, 'Delivered')
    modal(statusModal).ok()
    await settle()

    expect(modal(statusModal).isOpen()).toBe(false)
    // The list shows each order's last status, so a new status stales it.
    expect(lists()).toHaveLength(2)
  })

  test('an empty status is not sent, and the modal stays open on the message', async () => {
    const wrapper = await mountOrders()

    await openStatus(wrapper, '')
    modal(statusModal).ok()
    await settle()

    expect(writes()).toEqual([])
    expect(modal(statusModal).isOpen()).toBe(true)
    expect(document.getElementById(statusModal).textContent).toContain('Please enter a status')
  })

  test('a failed write reports it and keeps the modal open', async () => {
    api.post(statusEndpoint, serverError)
    const wrapper = await mountOrders()

    await openStatus(wrapper, 'Delivered')
    modal(statusModal).ok()
    await settle()

    expect(bodies()).toContain('Error creating status')
    expect(modal(statusModal).isOpen()).toBe(true)
  })

  test('reopening starts blank, whichever order it was last opened for', async () => {
    api.get(endpoint, () => paginated([order(), order({ id: 6, purchase_order_id: 'PO-0006' })]))
    const wrapper = await mountOrders()
    const buttons = wrapper.findAll('tbody button[title="Change status"]')

    await buttons[0].trigger('click')
    await settle()
    modal(statusModal).typeInto('#change-status-status', 'half typed')
    modal(statusModal).cancel()
    await settle()

    await buttons[1].trigger('click')
    await settle()
    expect(document.querySelector(`#${statusModal} #change-status-status`).value).toBe('')
    modal(statusModal).typeInto('#change-status-status', 'Shipped')
    modal(statusModal).ok()
    await settle()

    expect(writes()[0].body).toEqual({ purchase_order: 6, status: 'Shipped' })
  })
})

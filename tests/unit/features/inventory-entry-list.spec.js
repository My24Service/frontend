import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { vPurchaseOrderEntry } from '@/api/valibot.gen'
import * as Api from '@/services/api-client'
import { PurchaseOrderEntryList } from '@/features/inventory/entry'
import { fixtureFor, paginated } from '../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../support/api-seam/index.js'
import { createTestQueryClient, mountListView, toasts } from '../support/form-harness.js'
import { serverError } from '../support/list-harness.js'
import { modal } from '../support/modal.js'

const api = installApiSeam()
const endpoint = '/api/inventory/purchaseorder-entry/'

const routes = [
  { name: 'purchaseorder-entry-add', path: '/inventory/entries/form', component: { template: '<div />' } },
  { name: 'purchaseorder-entry-edit', path: '/inventory/entries/form/:pk', component: { template: '<div />' } },
]

function entry(overrides = {}) {
  return fixtureFor(vPurchaseOrderEntry, {
    id: 42,
    order_id: 'PO-1',
    supplier: 'ACME',
    material_name: 'Widget',
    amount: 3,
    entry_date: '04/03/2026',
    stock_location_name: 'Warehouse',
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([entry()], { count: 45 }))
  api.delete(endpoint + '{id}/', noContent)
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountEntries(options = {}) {
  const wrapper = await mountListView(PurchaseOrderEntryList, { deep: true, routes, ...options })
  await settle()
  return wrapper
}

describe('PurchaseOrderEntryList', () => {
  test('loads page one and renders every column under the legacy headers', async () => {
    const wrapper = await mountEntries()

    expect(listRequests()[0]).toMatchObject({ path: endpoint, query: { page: '1', page_size: '20' } })
    expect(wrapper.get('h3').text()).toContain('Entries')
    expect(wrapper.findAll('thead th').map((th) => th.text()))
      .toEqual(['Order ID', 'Supplier', 'Product', 'Amount', 'Entry date', 'Moved to location', ''])
    expect(wrapper.get('tbody').findAll('td').map((td) => td.text()).slice(0, 6))
      .toEqual(['PO-1', 'ACME', 'Widget', '3', '04/03/2026', 'Warehouse'])
  })

  test('the order id links to the edit', async () => {
    const wrapper = await mountEntries()

    expect(wrapper.get('tbody a').attributes('href')).toBe('/inventory/entries/form/42')
  })

  test('the add button goes to the add route', async () => {
    const wrapper = await mountEntries()

    const add = wrapper.findAll('a').find((link) => link.text() === 'Add entry')
    expect(add.attributes('href')).toBe('/inventory/entries/form')
  })

  test('the row action is a delete, with no edit icon', async () => {
    const wrapper = await mountEntries()

    expect(wrapper.find('button[title="Delete"]').exists()).toBe(true)
    expect(wrapper.find('a[title="Edit"]').exists()).toBe(false)
  })

  test('no header sorts: the endpoint has no ordering to send', async () => {
    const wrapper = await mountEntries()

    expect(wrapper.findAll('thead th[aria-label^="Sort by"]')).toHaveLength(0)
  })

  test('a search term is debounced onto the wire', async () => {
    const wrapper = await mountEntries()

    await wrapper.get('input[aria-label="Search entries"]').setValue('widget')
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({ q: 'widget', page: '1' })
  })

  test('an empty list has an explicit empty state', async () => {
    api.get(endpoint, paginated([]))
    const wrapper = await mountEntries()

    expect(wrapper.get('tbody').text()).toContain('No entries found')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)

    await mountEntries()

    expect(bodies()).toContain('Error loading entries')
  })
})

describe('PurchaseOrderEntryList row actions', () => {
  test('delete confirms, sends the row id and refetches', async () => {
    const wrapper = await mountEntries()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)
    expect(document.body.textContent).toContain('Are you sure you want to delete this entry?')

    modal('delete-purchaseorder-entry-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path).toBe(endpoint + '42/')
    expect(listRequests()).toHaveLength(2)
    expect(bodies()).toContain('Entry has been deleted')
  })

  // REGRESSION. The delete refreshed only the entry reads. An entry counts
  // toward its order and its order's products, and booked stock server-side,
  // so those reads went stale with it.
  test('a delete makes the order, product and stock reads stale too', async () => {
    api.get('/api/inventory/purchaseorder/', paginated([]))
    api.get('/api/inventory/purchaseorder-material/', paginated([]))
    api.get('/api/inventory/stock-location/', paginated([]))
    const queryClient = createTestQueryClient()
    const others = [
      Api.InventoryPurchaseorder.list.options({ query: { page: 1 } }),
      Api.InventoryPurchaseorderMaterial.list.options({ query: { page: 1 } }),
      Api.InventoryStockLocation.list.options({ query: { page: 1 } }),
    ]
    await Promise.all(others.map((options) => queryClient.fetchQuery(options)))
    const wrapper = await mountEntries({ queryClient })

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-purchaseorder-entry-modal').ok()
    await settle()

    expect(others.map((options) => queryClient.getQueryState(options.queryKey).isInvalidated))
      .toEqual([true, true, true])
  })

  test('a failed delete keeps the row and reports it', async () => {
    api.delete(endpoint + '{id}/', serverError)
    const wrapper = await mountEntries()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-purchaseorder-entry-modal').ok()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('Widget')
    expect(bodies()).toContain('Error deleting entry')
  })
})

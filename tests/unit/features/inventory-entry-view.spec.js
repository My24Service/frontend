import { beforeEach, describe, expect, test } from 'vitest'
import { vPurchaseOrderEntry } from '@/api/valibot.gen'
import { PurchaseOrderEntryView } from '@/features/inventory/entry'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../support/form-harness.js'
import { serverError } from '../support/list-harness.js'

const api = installApiSeam()
const ENTRY = '/api/inventory/purchaseorder-entry/{id}/'

const routes = [
  { name: 'purchaseorder-entry-edit', path: '/inventory/entries/form/:pk', component: { template: '<div />' } },
]

const RECORD = fixtureFor(vPurchaseOrderEntry, {
  id: 42,
  order_id: 'PO-1',
  supplier: 'ACME',
  material_name: 'Widget',
  amount: 3,
  entry_date: '04/03/2026',
  entry_date_iso: '2026-03-04',
  stock_location_name: 'Warehouse',
  created: '01-01-2026',
})

beforeEach(() => {
  api.get(ENTRY, () => RECORD)
})

async function mountView() {
  const wrapper = mountForm(PurchaseOrderEntryView, { deep: true, props: { pk: 42 }, routes })
  await settle()
  return wrapper
}

// The legacy view read a supplier by the entry's id and rendered an empty
// "Supplier info" block, so there is no markup to keep: this is a new screen
// and the snapshot is of it.
const normalise = (html) => html.replace(/ id="[^"]*"/g, '').replace(/ for="[^"]*"/g, '').replace(/ data-v-[a-z0-9]+(="")?/g, '')

describe('PurchaseOrderEntryView', () => {
  test('renders the entry', async () => {
    expect(normalise((await mountView()).html())).toMatchSnapshot()
  })

  test('reads the entry by the route pk', async () => {
    await mountView()

    expect(api.requests().filter((request) => request.method === 'get').map((request) => request.path))
      .toEqual(['/api/inventory/purchaseorder-entry/42/'])
  })

  test('shows the order, supplier, product, amount, date and location', async () => {
    const text = (await mountView()).text()

    for (const value of ['PO-1', 'ACME', 'Widget', '3', '04/03/2026', 'Warehouse']) expect(text).toContain(value)
  })

  test('does not show the supplier block the legacy view rendered empty', async () => {
    expect((await mountView()).text()).not.toContain('Supplier info')
  })

  test('Edit links to the edit form of this entry', async () => {
    const wrapper = await mountView()

    const edit = wrapper.findAll('a').find((link) => link.text() === 'Edit')
    expect(edit.attributes('href')).toBe('/inventory/entries/form/42')
  })

  test('Back goes back', async () => {
    const wrapper = await mountView()

    await wrapper.findAll('button').find((button) => button.text() === 'Back').trigger('click')

    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a failed read tells the user', async () => {
    api.get(ENTRY, serverError)

    await mountView()

    expect(toasts().map((toast) => toast.body)).toContain('Error fetching entry')
  })
})

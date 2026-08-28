import { beforeEach, describe, expect, test, vi } from 'vitest'

// MaintenanceContractList, rewritten into the feature folder. These specs
// began as the characterisation of the legacy screen and now hold the
// rewrite to the same requests, row for row — with the declared exceptions
// called out inline and collected in the Slice README.
import { MaintenanceContractList } from '@/features/customer'
import { vPaginatedMaintenanceContractList } from '@/api/valibot.gen'

import { goldenTest, goldensFor } from '../../helpers/golden.js'
import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { toasts } from '../../support/form-harness.js'
import { openDelete, openSearch, rowTexts, serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { customerRoutes } from '../../support/customer-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * The maintenance-contract list, characterised on the legacy component.
 *
 * What the screen does, held from the legacy screen:
 *
 *   - page and search term live in the URL and ride the wire; unlike the
 *     customer list there is no sort wiring at all — the headers show sort
 *     icons but nothing listens, so a click sorts the current page locally
 *     and no request carries it;
 *   - the delete flow asks, deletes, and reloads the page you were on.
 *
 * One declared change: the legacy screen kept a search term in service
 * state only (a reload lost it); the rewrite puts it in the URL, the
 * Slice's route-paged-list pattern.
 */
const api = installApiSeam()
const goldens = goldensFor('maintenance-contract-list')

const ITEM = itemSchemaOf(vPaginatedMaintenanceContractList)

function contractRow(overrides = {}) {
  return fixtureFor(ITEM, {
    id: 5,
    customer: 7,
    name: 'Gouda maintenance',
    customer_view: { id: 7, name: 'Acme BV', city: 'Gouda' },
    sum_tariffs: '160.00',
    remarks: 'Yearly check',
    created_orders: 2,
    num_order_equipment: 3,
    num_equipment: 4,
    ...overrides,
  })
}

beforeEach(() => {
  api.get('/api/customer/maintenance-contract/', paginated([contractRow()], { count: 1 }))
  api.delete('/api/customer/maintenance-contract/{id}/', noContent)
})

async function mountList(query = {}) {
  const { mountListView } = await import('../../support/form-harness.js')
  const wrapper = await mountListView(MaintenanceContractList, {
    deep: true,
    routes: customerRoutes,
    query,
    main: { getDefaultCurrency: 'EUR' },
  })
  await settle()
  return wrapper
}

describe('MaintenanceContractList, loading', () => {
  // Recording hooks: a scenario the directory has no HAR for skips, naming
  // itself (see tests/unit/golden/README.md). The live assertions beside
  // each hook hold the converted screen to the requests characterised from
  // the legacy one.
  goldenTest(goldens, 'initial load', 'maintenance-contract-list', async () => {
    await mountList()
    return api.requests()
  })

  goldenTest(goldens, 'page 2 and search term', 'maintenance-contract-list', async () => {
    await mountList({ page: '2', q: 'acme' })
    return api.requests()
  })

  test('asks for page one with no other parameters', async () => {
    await mountList()

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/customer/maintenance-contract/', query: { page: '1' }, body: undefined },
    ])
  })

  test('carries the URL page and search term to the backend', async () => {
    await mountList({ page: '2', q: 'acme' })

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/customer/maintenance-contract/', query: { page: '2', q: 'acme' }, body: undefined },
    ])
  })

  test('shows a row for every contract the backend returned', async () => {
    const wrapper = await mountList()

    expect(rowTexts(wrapper)).toHaveLength(1)
    expect(rowTexts(wrapper)[0]).toContain('Gouda maintenance')
    expect(rowTexts(wrapper)[0]).toContain('Acme BV')
  })

  test('formats the contract value', async () => {
    const wrapper = await mountList()

    const row = rowTexts(wrapper)[0]
    // toFormat('$0.00') renders the currency's symbol — € for the EUR fixture.
    expect(row).toContain('€160.00')
    // The legacy `#cell(totals)` slot (created orders / contract equipment /
    // equipment in orders counters) was dead — no `totals` column existed in
    // the fields, so the counters never rendered. The rewrite drops it; the
    // row still shows none.
  })

  test('links rows to the contract detail page', async () => {
    const wrapper = await mountList()

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('/customers/maintenance-contracts/view/5')
  })

  test('links the edit icon to the form', async () => {
    const wrapper = await mountList()

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('/customers/maintenance-contracts/form/5')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/customer/maintenance-contract/', serverError)

    await mountList()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading maintenance contracts')
  })
})

describe('MaintenanceContractList, search', () => {
  test('the modal puts the term in the URL, where a reload refetches with it', async () => {
    const wrapper = await mountList()

    await openSearch(wrapper)
    modal('search-modal').type('acme')
    modal('search-modal').ok()
    await settle()

    // Declared change (see the Slice README): the legacy screen kept the
    // term in service state only, so a reload lost it; the URL now carries
    // it, the Slice's route-paged-list pattern.
    expect(wrapper.vm.$route.query).toMatchObject({ q: 'acme' })
    expect(api.requests()[1]).toEqual({
      method: 'get',
      path: '/api/customer/maintenance-contract/',
      query: { page: '1', q: 'acme' },
      body: undefined,
    })
  })
})

describe('MaintenanceContractList, delete', () => {
  test('asks, deletes, and reloads the page you were on', async () => {
    const wrapper = await mountList({ page: '2', q: 'acme' })

    await openDelete(wrapper)
    expect(modal('delete-maintenance-contract-modal').isOpen()).toBe(true)

    modal('delete-maintenance-contract-modal').ok()
    await settle()

    expect(api.requests().slice(1)).toEqual([
      { method: 'delete', path: '/api/customer/maintenance-contract/5/', query: {} },
      { method: 'get', path: '/api/customer/maintenance-contract/', query: { page: '2', q: 'acme' }, body: undefined },
    ])
    expect(toasts().map((toast) => toast.title)).toContain('Deleted')
  })

  test('says so when the delete fails, and keeps the row', async () => {
    api.delete('/api/customer/maintenance-contract/{id}/', serverError)

    const wrapper = await mountList()

    await openDelete(wrapper)
    modal('delete-maintenance-contract-modal').ok()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Error deleting maintenance contract')
    expect(rowTexts(wrapper)).toHaveLength(1)
  })
})

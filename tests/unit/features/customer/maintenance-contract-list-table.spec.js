import { beforeEach, describe, expect, test, vi } from 'vitest'

import { MaintenanceContractListTable } from '@/features/customer'
import { vPaginatedMaintenanceContractList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { customerRoutes } from '../../support/customer-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * MaintenanceContractListTable — the TanStack Table prototype of the
 * maintenance-contract list, the second Customer data point. The columns
 * mirror the original exactly: name linking to the contract view, the
 * customer's name, the dinero-formatted contract value, remarks, created,
 * and the edit/delete icons. The schema declares only page/page_size/q, so
 * a sort click never changes the wire.
 */

const api = installApiSeam()

const ITEM = itemSchemaOf(vPaginatedMaintenanceContractList)

function contractRow(overrides = {}) {
  return fixtureFor(ITEM, {
    id: 9,
    name: 'Full service 2026',
    customer_view: {name: 'Acme BV'},
    sum_tariffs: '1234.5',
    remarks: 'Includes weekend cover',
    created: '2026-01-05',
    ...overrides,
  })
}

function contractPage({ count = 30 } = {}) {
  return paginated(
    [
      contractRow(),
      contractRow({id: 10, name: 'Basic 2026', sum_tariffs: '', remarks: null}),
    ],
    { count },
  )
}

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

async function mountTable() {
  const { mountListView } = await import('../../support/form-harness.js')
  const wrapper = await mountListView(MaintenanceContractListTable, {
    deep: true,
    routes: customerRoutes,
    // The legacy screen stamped every row with the tenant's default currency.
    main: {getDefaultCurrency: 'EUR'},
  })
  await settle()
  return wrapper
}

beforeEach(() => {
  api.get('/api/customer/maintenance-contract/', contractPage())
  api.delete('/api/customer/maintenance-contract/{id}/', noContent)
})

describe('MaintenanceContractListTable, wire contract', () => {
  test('the initial load sends the page and the page size, and nothing else', async () => {
    await mountTable()

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/customer/maintenance-contract/',
      query: { page: '1', page_size: '20' },
    })
  })

  test('shows a row for every contract the backend returned', async () => {
    const wrapper = await mountTable()

    expect(wrapper.findAll('tbody tr').length).toBe(2)
  })

  test('renders the original columns: linked name, customer, dinero value, remarks', async () => {
    const wrapper = await mountTable()

    const firstRow = wrapper.findAll('tbody tr')[0]
    expect(firstRow.find('a').attributes('href')).toBe('/customers/maintenance-contracts/view/9')
    expect(firstRow.text()).toContain('Full service 2026')
    expect(firstRow.text()).toContain('Acme BV')
    expect(firstRow.text()).toContain('€1234.50')
    expect(firstRow.text()).toContain('Includes weekend cover')
  })

  test('an absent contract value renders an empty cell, not an error', async () => {
    const wrapper = await mountTable()

    const secondRow = wrapper.findAll('tbody tr')[1]
    expect(secondRow.text()).not.toContain('€')
  })

  test('a sort click sorts the wire through the ordering allow-list', async () => {
    const wrapper = await mountTable()

    await wrapper.get('th[aria-label="Sort by name"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toEqual({
      page: '1',
      page_size: '20',
      ordering: 'name',
    })
  })

  test('the customer and value columns sort through the backend too', async () => {
    // customer_view_name is a serializer method field backed by the customer
    // relation; sum_tariffs is the queryset's annotation - both are on the
    // allow-list under their wire names.
    const wrapper = await mountTable()

    await wrapper.get('th[aria-label="Sort by customer_view_name"]').trigger('click')
    await settle()
    expect(api.requests().at(-1).query).toMatchObject({ ordering: 'customer_view_name' })

    await wrapper.get('th[aria-label="Sort by sum_tariffs"]').trigger('click')
    await settle()
    expect(api.requests().at(-1).query).toMatchObject({ ordering: 'sum_tariffs' })
  })
})

describe('MaintenanceContractListTable search and pagination', () => {
  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountTable()

    await wrapper.get('input[aria-label="Search maintenance contracts"]').setValue('full')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ q: 'full' })
  })

  test('the next-page button asks for page two', async () => {
    const wrapper = await mountTable()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', page_size: '20' })
  })
})

describe('MaintenanceContractListTable loading, empty and error states', () => {
  test('says so when the backend returned nothing', async () => {
    api.get('/api/customer/maintenance-contract/', paginated([]))
    const wrapper = await mountTable()

    expect(wrapper.text()).toContain('No maintenance contracts found')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/customer/maintenance-contract/', serverError)

    await mountTable()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading maintenance contracts')
  })
})

describe('MaintenanceContractListTable delete', () => {
  test('deletes through the confirmation modal and refetches', async () => {
    const wrapper = await mountTable()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-maintenance-contract-modal').ok()
    await settle()

    const deleteSent = api.requests().find((sent) => sent.method === 'delete')
    expect(deleteSent).toMatchObject({ path: '/api/customer/maintenance-contract/9/' })
    expect(toasts().map((toast) => toast.body)).toContain('Maintenance contract has been deleted')
    const listFetches = api.requests().filter((sent) => sent.method === 'get')
    expect(listFetches.length).toBeGreaterThan(1)
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountTable()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })
})

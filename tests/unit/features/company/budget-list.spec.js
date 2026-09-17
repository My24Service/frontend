import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { vBudget } from '@/api/valibot.gen'
import BudgetList from '@/features/company/budget/BudgetList.vue'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({ create: toastCreate }),
}))

const api = installApiSeam()
const endpoint = '/api/company/budget/'

const routes = [
  { name: 'company-budget-view', path: '/company/budgets/:pk', component: { template: '<div />' } },
]

function budget(overrides = {}) {
  return fixtureFor(vBudget, {
    id: 4,
    year: 2026,
    amount: '5000.00',
    amount_currency: 'EUR',
    created: '01-01-2026',
    modified: '02-01-2026',
    ...overrides,
  })
}

const bodies = () => toasts().map((toast) => toast.body)
const listRequests = () => api.requests().filter((request) => request.method === 'get' && request.path === endpoint)
const writes = () => api.requests().filter((request) => ['post', 'patch'].includes(request.method))

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(endpoint, () => paginated([budget()], { count: 45 }))
  api.get('/api/company/budget/{id}/', budget())
  api.post(endpoint, ({ body }) => fixtureFor(vBudget, { id: 5, ...body }))
  api.patch('/api/company/budget/{id}/', ({ body }) => fixtureFor(vBudget, { id: 4, ...body }))
  api.delete(endpoint + '{id}/', noContent)
})
afterEach(() => window.history.replaceState(null, '', '/'))

async function mountBudgets(options = {}) {
  return mountListView(BudgetList, {
    deep: true,
    routes,
    main: { getDefaultCurrency: 'EUR' },
    ...options,
  })
}

async function openAddModal(wrapper) {
  await wrapper.findAll('button').find((button) => button.text().includes('New budget')).trigger('click')
  await settle()
}

describe('BudgetList', () => {
  test('loads page one and renders every column', async () => {
    const wrapper = await mountBudgets()
    await settle()

    expect(listRequests()[0]).toMatchObject({ path: endpoint, query: { page: '1', page_size: '20' } })
    const body = wrapper.get('tbody').text()
    expect(body).toContain('2026')
    expect(body).toContain('€5000.00')
    expect(wrapper.get('h3').text()).toContain('Budgets')
  })

  test('the year links to the detail view', async () => {
    const wrapper = await mountBudgets()
    await settle()

    expect(wrapper.get('tbody a').attributes('href')).toBe('/company/budgets/4')
  })

  test('a search term is debounced onto the wire', async () => {
    const wrapper = await mountBudgets()
    await settle()

    await wrapper.get('input[aria-label="Search budgets"]').setValue('2026')
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    expect(listRequests().at(-1).query).toMatchObject({ q: '2026', page: '1' })
  })

  test('an empty list has an explicit empty state', async () => {
    api.get(endpoint, paginated([]))
    const wrapper = await mountBudgets()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('No budgets found')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    await mountBudgets()
    await settle()

    expect(bodies()).toContain('Error loading budgets')
  })
})

describe('BudgetList modal', () => {
  test('a filled modal creates, closes and refetches', async () => {
    const wrapper = await mountBudgets()
    await settle()
    await openAddModal(wrapper)

    expect(modal('model-modal').isOpen()).toBe(true)
    modal('model-modal').typeInto('#model-year', '2027')
    modal('model-modal').typeInto('.input-number', '250')
    modal('model-modal').typeInto('.input-decimal', '50')
    modal('model-modal').ok()
    await settle()

    const post = writes().find((request) => request.method === 'post')
    expect(post.path).toBe(endpoint)
    expect(post.body).toEqual({ year: 2027, amount: '250.50' })
    expect(bodies()).toContain('Budget added')
    expect(listRequests()).toHaveLength(2)
  })

  test('an empty year blocks the submit and keeps the modal open', async () => {
    const wrapper = await mountBudgets()
    await settle()
    await openAddModal(wrapper)

    modal('model-modal').typeInto('#model-year', '')
    modal('model-modal').ok()
    await settle()

    // The modal is teleported out of the wrapper tree, so its copy reads off
    // the document.
    expect(document.getElementById('model-modal').textContent).toContain('Please enter a valid year')
    expect(writes()).toHaveLength(0)
    expect(modal('model-modal').isOpen()).toBe(true)
  })

  test('the edit modal fills the record and patches it', async () => {
    const wrapper = await mountBudgets()
    await settle()

    await wrapper.get('button[title="Edit"]').trigger('click')
    await settle()

    expect(modal('model-modal').isOpen()).toBe(true)
    modal('model-modal').typeInto('#model-year', '2028')
    modal('model-modal').ok()
    await settle()

    // The amount input was never touched, so the record's amount rides along.
    const patch = writes().find((request) => request.method === 'patch')
    expect(patch.path).toBe(endpoint + '4/')
    expect(patch.body).toEqual({ year: 2028, amount: '5000.00' })
    expect(bodies()).toContain('Budget modified')
    expect(listRequests()).toHaveLength(2)
  })

  test('a failed save reports and keeps the modal open', async () => {
    api.post(endpoint, serverError)
    const wrapper = await mountBudgets()
    await settle()
    await openAddModal(wrapper)

    modal('model-modal').typeInto('#model-year', '2027')
    modal('model-modal').ok()
    await settle()

    expect(bodies()).toContain('Error handling budget')
    expect(modal('model-modal').isOpen()).toBe(true)
    expect(listRequests()).toHaveLength(1)
  })
})

describe('BudgetList row actions', () => {
  test('delete confirms, sends the row id and refetches', async () => {
    const wrapper = await mountBudgets()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)

    modal('delete-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path).toBe(endpoint + '4/')
    expect(listRequests()).toHaveLength(2)
    expect(bodies()).toContain('Budget has been deleted')
  })

  test('a failed delete keeps the row and reports it', async () => {
    api.delete(endpoint + '{id}/', serverError)
    const wrapper = await mountBudgets()
    await settle()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-modal').ok()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('2026')
    expect(bodies()).toContain('Error deleting budget')
  })
})

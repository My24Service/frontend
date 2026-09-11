import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'

import { CustomerForm } from '@/features/customer'
import {
  vBranch,
  vCustomer,
  vCustomerCreate,
  vPaginatedCustomerDocumentList,
  vPaginatedPartnerDetailList,
} from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { customerRoutes } from '../../support/customer-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const api = installApiSeam()

const MAIN = {
  getCountries: [{ value: 'NL', text: 'Nederland' }],
  getDefaultCurrency: 'EUR',
}

const DETAIL = () =>
  fixtureFor(vCustomer, {
    id: 5,
    name: 'Acme BV',
    address: 'Main 1',
    postal: '1234AB',
    city: 'Amsterdam',
    country_code: 'NL',
    customer_id: '5013',
    tel: '010 1234567',
    email: 'info@acme.example',
    remarks: null,
    time: null,
    time2: null,
    timealt: null,
    timealt2: null,
    products_without_tax: true,
    maintenance_contract: 'Gouda',
    standard_hours_hour: 2,
    standard_hours_minute: 30,
    call_out_costs: '75.00',
    call_out_costs_currency: 'EUR',
    hourly_rate_engineer: '85.00',
    hourly_rate_engineer_currency: 'EUR',
    hourly_rate_partner_engineer: '95.00',
    hourly_rate_partner_engineer_currency: 'EUR',
    price_per_km: '0.60',
    price_per_km_currency: 'EUR',
    branch_partner: null,
    branch_id: null,
    use_branch_address: false,
    documents: [],
  })

const PARTNERS = paginated([
  fixtureFor(itemSchemaOf(vPaginatedPartnerDetailList), {
    id: 7,
    partner_view: { has_branches: true, companycode: 'acm', city: 'Den Bosch' },
  }),
])

const DOCUMENTS = paginated([
  fixtureFor(itemSchemaOf(vPaginatedCustomerDocumentList), {
    id: 9,
    customer: 5,
    name: 'Manual.pdf',
    file: 'https://tenant.example/media/documents/manual.pdf',
  }),
])

const BRANCH = () =>
  fixtureFor(vBranch, {
    id: 60,
    name: 'Acme Den Bosch',
    address: 'Plein 1',
    postal: '5211AV',
    city: 'Den Bosch',
    country_code: 'NL',
  })

async function mountCustomerForm(props = {}) {
  const wrapper = mountForm(CustomerForm, { deep: true, routes: customerRoutes, main: MAIN, props })
  await settle()
  return wrapper
}

async function fillValidCreate(wrapper) {
  await wrapper.get('#customer_customer_id').setValue('5013')
  await wrapper.get('#customer_name').setValue('Acme BV')
  await wrapper.get('#customer_address').setValue('Main 1')
  await wrapper.get('#customer_postal').setValue('1234AB')
  await wrapper.get('#customer_city').setValue('Amsterdam')
  await wrapper.get('select').setValue('NL')
}

async function submit(wrapper) {
  const save = wrapper.findAll('button').find((button) => button.text() === 'Save')
  await save.trigger('click')
  await settle()
}

function buttonByText(wrapper, text) {
  const button = wrapper.findAll('button').find((candidate) => candidate.text().includes(text))
  expect(button, `no button '${text}' on the screen`).toBeDefined()
  return button
}

beforeEach(() => {
  api.get('/api/company/partner/', PARTNERS)
  api.get('/api/customer/customer/', DETAIL())
  api.get('/api/customer/customer/{id}/', DETAIL())
  api.get('/api/customer/customer/check_customer_id_handling/', { customer_id: null, created: false })
  api.get('/api/customer/document/', DOCUMENTS)
  api.post('/api/customer/customer/', fixtureFor(vCustomerCreate, { id: 5, name: 'Acme BV' }))
  api.patch('/api/customer/customer/{id}/', DETAIL())
})

describe('CustomerForm, create', () => {
  test('fetches the partner list and the id handling before anything else', async () => {
    await mountCustomerForm()

    expect(api.requests().map((request) => request.path)).toEqual([
      '/api/company/partner/',
      '/api/customer/customer/check_customer_id_handling/',
    ])
  })

  // The dropdown is filled from this one read, so it must carry more than the
  // API's default page of 20 partners. 1000 is that paginator's ceiling
  // (my24service `apps/core/rest.py` My24Pagination: page_size 20,
  // max_page_size 1000), and a larger value is clamped down to it rather than
  // rejected — so this is the whole collection a tenant can be offered.
  test('asks for every partner, not just the first page', async () => {
    await mountCustomerForm()

    const partners = api.requests().find((request) => request.path === '/api/company/partner/')

    expect(partners.query).toEqual({ page: '1', page_size: '1000' })
  })

  test('a tenant that does not generate ids leaves the input editable and empty', async () => {
    const wrapper = await mountCustomerForm()

    expect(wrapper.get('#customer_customer_id').attributes('readonly')).toBeUndefined()
    expect(wrapper.get('#customer_customer_id').element.value).toBe('')
  })

  test('a tenant that generates ids prefills a readonly id', async () => {
    api.get('/api/customer/customer/check_customer_id_handling/', { customer_id: 5013, created: true })

    const wrapper = await mountCustomerForm()

    expect(wrapper.get('#customer_customer_id').attributes('readonly')).toBeDefined()
    expect(wrapper.get('#customer_customer_id').element.value).toBe('5013')
  })

  test('generate-new asks for the latest id and fills the input', async () => {
    api.get('/api/customer/customer/get_new_customer_id_from_latest/', { result: { last_customer_id: 5021 } })

    const wrapper = await mountCustomerForm()
    const link = wrapper.findAll('a').find((candidate) => candidate.text() === 'generate new')
    await link.trigger('click')
    await settle()

    expect(api.requests().map((request) => request.path)).toContain(
      '/api/customer/customer/get_new_customer_id_from_latest/',
    )
    expect(wrapper.get('#customer_customer_id').element.value).toBe('5021')
  })

  test('an empty submit sends nothing and says what is missing', async () => {
    const wrapper = await mountCustomerForm()

    await submit(wrapper)

    expect(api.requests().map((request) => request.method)).not.toContain('post')
    expect(wrapper.text()).toContain('Please enter a customer ID')
    expect(wrapper.text()).toContain('Please enter a name')
    expect(wrapper.text()).toContain('Please enter an address')
    expect(wrapper.text()).toContain('Please enter a postal')
    expect(wrapper.text()).toContain('Please enter a city')
  })

  test('a valid create posts the typed fields and nothing else', async () => {
    const wrapper = await mountCustomerForm()
    await fillValidCreate(wrapper)

    await submit(wrapper)

    expect(api.requests().find((request) => request.method === 'post')).toEqual({
      method: 'post',
      path: '/api/customer/customer/',
      query: {},
      body: {
        customer_id: '5013',
        name: 'Acme BV',
        address: 'Main 1',
        postal: '1234AB',
        city: 'Amsterdam',
        country_code: 'NL',
      },
    })
    expect(toasts().map((toast) => toast.title)).toContain('Created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a failed create says so and keeps the form', async () => {
    api.post('/api/customer/customer/', new HttpResponse(JSON.stringify({ detail: 'nope' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }))

    const wrapper = await mountCustomerForm()
    await fillValidCreate(wrapper)
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating customer')
    expect(routerGo()).not.toHaveBeenCalled()
  })

})

describe('CustomerForm, edit', () => {
  test('fetches the record and, once it has an id, its documents', async () => {
    await mountCustomerForm({ pk: '5' })

    expect(api.requests().map((request) => request.path)).toEqual([
      '/api/company/partner/',
      '/api/customer/customer/5/',
      '/api/customer/document/',
    ])
    expect(api.requests()[2].query).toEqual({ customer: '5', page: '1', page_size: '1000' })
  })

  test('fills the inputs from the record', async () => {
    const wrapper = await mountCustomerForm({ pk: '5' })

    expect(wrapper.get('#customer_name').element.value).toBe('Acme BV')
    expect(wrapper.get('#customer_address').element.value).toBe('Main 1')
    expect(wrapper.get('#customer_customer_id').element.value).toBe('5013')
    expect(wrapper.get('#customer_maintenance_contract').element.value).toBe('Gouda')
  })

  test('saving PATCHes the record with the whole model', async () => {
    const wrapper = await mountCustomerForm({ pk: '5' })
    await submit(wrapper)

    const patch = api.requests().find((request) => request.method === 'patch')
    expect(patch.path).toBe('/api/customer/customer/5/')

    expect(patch.body).toMatchObject({
      name: 'Acme BV',
      address: 'Main 1',
      postal: '1234AB',
      city: 'Amsterdam',
      country_code: 'NL',
      customer_id: '5013',
      tel: '010 1234567',
      email: 'info@acme.example',
      products_without_tax: true,
      maintenance_contract: 'Gouda',
      standard_hours_hour: 2,
      standard_hours_minute: 30,
      call_out_costs: '75.00',
      hourly_rate_engineer: '85.00',
      hourly_rate_partner_engineer: '95.00',
      price_per_km: '0.60',
      branch_partner: null,
    })

    expect(patch.body.remarks).toBeUndefined()

    expect(patch.body.created).toBeUndefined()
    expect(patch.body.modified).toBeUndefined()
    for (const field of ['time', 'time2', 'timealt', 'timealt2']) {
      expect(patch.body[field]).toBeUndefined()
    }
    expect(patch.body.branch_id).toBeNull()
    expect(patch.body.id).toBeUndefined()
    expect(patch.body.documents).toBeUndefined()

    expect(toasts().map((toast) => toast.title)).toContain('Updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a failed save says so and keeps the form', async () => {
    api.patch('/api/customer/customer/{id}/', new HttpResponse(
      JSON.stringify({ name: ['This field may not be blank.'] }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    ))

    const wrapper = await mountCustomerForm({ pk: '5' })
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error updating customer')
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('the branch-partner dropdown only lists partners that have branches', async () => {
    const wrapper = await mountCustomerForm({ pk: '5' })

    const options = wrapper.findAll('#customer_branch_partners option').map((option) => option.text())
    expect(options).toEqual(['-', 'acm - Den Bosch'])
  })

  test('choosing a branch partner fetches its branches', async () => {
    api.get('/api/company/partner/{id}/branches/', { branches: [BRANCH()] })

    const wrapper = await mountCustomerForm({ pk: '5' })
    await wrapper.get('#customer_branch_partners').setValue('7')
    await settle()

    expect(api.requests().map((request) => request.path)).toContain('/api/company/partner/7/branches/')
  })

  test('synchronize orders copies the customer orders and refetches the branches', async () => {
    api.get('/api/company/partner/{id}/branches/', { branches: [BRANCH()] })
    api.post('/api/company/partner/{id}/copy_customer_orders/', { num_copied: 3 })

    const wrapper = await mountCustomerForm({ pk: '5' })
    await wrapper.get('#customer_branch_partners').setValue('7')
    await settle()
    await buttonByText(wrapper, 'Synchronize orders').trigger('click')
    await settle()

    expect(api.requests().filter((request) => request.method === 'post')).toEqual([
      {
        method: 'post',
        path: '/api/company/partner/7/copy_customer_orders/',
        query: {},
        body: { customer_id: 5 },
      },
    ])
    expect(toasts().map((toast) => toast.title)).toContain('Synced')
  })

  test('create-branch asks, posts, and refetches the branches', async () => {
    api.get('/api/company/partner/{id}/branches/', { branches: [BRANCH()] })
    api.post('/api/company/partner/{id}/branch_create_from_customer/', { branch: fixtureFor(vBranch, { ...BRANCH(), id: 61 }) })
    vi.stubGlobal('confirm', vi.fn(() => true))

    const wrapper = await mountCustomerForm({ pk: '5' })
    await wrapper.get('#customer_branch_partners').setValue('7')
    await settle()
    await buttonByText(wrapper, 'Create').trigger('click')
    await settle()

    expect(api.requests().filter((request) => request.method === 'post')).toEqual([
      {
        method: 'post',
        path: '/api/company/partner/7/branch_create_from_customer/',
        query: {},
        body: { customer_id: 5 },
      },
    ])
    expect(confirm).toHaveBeenCalledWith('Create branch from customer?')
  })

  // The wire never carries a branch for a customer with no branch partner: the
  // rule lives where the body is built (parse), not in validate, so a record
  // that still holds a branch id under a cleared partner saves without it.
  test('a record carrying a branch under no branch partner saves without the branch', async () => {
    api.get('/api/customer/customer/{id}/', {
      ...DETAIL(),
      branch_partner: null,
      branch_id: 60,
    })

    const wrapper = await mountCustomerForm({ pk: '5' })
    await submit(wrapper)

    const patch = api.requests().find((request) => request.method === 'patch')
    expect(patch.body.branch_partner).toBeNull()
    expect(patch.body.branch_id).toBeNull()
  })
})

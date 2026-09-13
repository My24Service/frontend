import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { SalesUserForm, SalesUserList } from '@/features/user'
import { vPaginatedSalesUserList, vSalesUser } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, mountListView, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { userRoutes } from '../../support/user-routes.js'

/** Mount the converted list at `query`, with the user routes its links need. */
async function mountSalesList({ query = {}, auth = {} } = {}) {
  const wrapper = await mountListView(SalesUserList, { deep: true, routes: userRoutes, query, auth })
  await settle()
  return wrapper
}

/** The text of every body row, one string per row. */
function rowTexts(wrapper) {
  return wrapper.findAll('tbody tr').map((row) => row.text())
}


vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

afterEach(() => {
  resetUrl()
})

const ITEM = itemSchemaOf(vPaginatedSalesUserList)

function salesRow(overrides = {}) {
  return fixtureFor(ITEM, {
    id: 11,
    username: 'jan',
    first_name: 'Jan',
    last_name: 'Jansen',
    full_name: 'Jan Jansen',
    email: 'jan@example.test',
    ...overrides,
  })
}

function salesPage({ count = 30 } = {}) {
  return paginated(
    [
      salesRow({ id: 11, username: 'jan', full_name: 'Jan Jansen' }),
      salesRow({ id: 12, username: 'piet', first_name: 'Piet', last_name: 'Pietersen', full_name: 'Piet Pietersen', email: 'piet@example.test' }),
    ],
    { count },
  )
}

const RECORD = fixtureFor(vSalesUser, {
  id: 11,
  username: 'jan',
  first_name: 'Jan',
  last_name: 'Jansen',
  full_name: 'Jan Jansen',
  email: 'jan@example.test',
})

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

/** Point the browser's address at a shared view of the list. */
function seedUrl(queryString) {
  window.history.replaceState(null, '', `/#/?${queryString}`)
}

/**
 * Hand the address back before the next test.
 *
 * urlSync writes the address, so without this a page change in one test is
 * restored by the next mount - on both sides of every test, not just after.
 */
function resetUrl() {
  window.history.replaceState(null, '', '/')
}

beforeEach(() => {
  resetUrl()
  // The username probe asks the generated op, so its request lands on the
  // strict seam like every other read: answer it available here.
  api.get('/api/company/username-exists/', { available: true })
  api.get('/api/company/salesuser/', salesPage())
  api.get('/api/company/salesuser/{id}/', RECORD)
  api.post('/api/company/salesuser/', RECORD)
  api.patch('/api/company/salesuser/{id}/', RECORD)
  api.delete('/api/company/salesuser/{id}/', noContent)
})

describe('SalesUserList, wire contract', () => {
  test('the initial load sends the page and the page size, and nothing else', async () => {
    await mountSalesList()

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/company/salesuser/',
      query: { page: '1', page_size: '20' },
    })
  })

  test('shows a row for every sales user the backend returned', async () => {
    const wrapper = await mountSalesList()

    expect(rowTexts(wrapper).length).toBe(2)
    expect(rowTexts(wrapper)[0]).toContain('Jan Jansen')
  })

  test('links each name to that sales user’s edit page', async () => {
    const wrapper = await mountSalesList()

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('/company/sales-users/form/11')
    expect(hrefs).toContain('/company/sales-users/form/12')
  })

  test('the add link shows for staff and superusers only', async () => {
    const staff = await mountSalesList({ auth: { isStaff: true } })
    expect(staff.find('a[href="/company/sales-users/form"]').exists()).toBe(true)

    const plain = await mountSalesList({ auth: { isStaff: false, isSuperuser: false } })
    expect(plain.find('a[href="/company/sales-users/form"]').exists()).toBe(false)
  })

  test('columns are not sortable — the endpoint declares no ordering parameter', async () => {
    // The sales-user list endpoint declares only page/page_size/q. A sort
    // the wire carried would be silently dropped, so the columns stay
    // non-sortable rather than sending a parameter nothing honours.
    const wrapper = await mountSalesList()

    expect(wrapper.find('th[aria-label^="Sort by"]').exists()).toBe(false)
    expect(wrapper.find('.sortable-header').exists()).toBe(false)
  })
})

describe('SalesUserList search and pagination', () => {
  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountSalesList()

    await wrapper.get('input[aria-label="Search sales users"]').setValue('jan')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ q: 'jan' })
  })

  test('the next-page button asks for page two', async () => {
    const wrapper = await mountSalesList()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', page_size: '20' })
  })
})

describe('SalesUserList URL mirroring', () => {
  test('a shared address restores the view, page included, before the first request', async () => {
    seedUrl('q=jan&page=2')

    const wrapper = await mountSalesList()

    expect(api.requests().at(-1).query).toEqual({
      page: '2',
      page_size: '20',
      q: 'jan',
    })
    expect(wrapper.get('input[aria-label="Search sales users"]').element.value).toBe('jan')
  })

  test('the restored page survives the search debounce', async () => {
    // The debounced draft watcher resets the page whenever a term is
    // committed; a restore writes the draft and the committed value together,
    // so the page the address asked for has to outlast its own window.
    seedUrl('q=jan&page=2')
    await mountSalesList()

    await pastDebounce()

    const pages = api.requests().filter((sent) => sent.method === 'get').map((sent) => sent.query.page)
    expect(pages).toEqual(['2'])
  })

  test('a page change writes the address bar', async () => {
    const wrapper = await mountSalesList()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(window.location.hash).toContain('page=2')
  })
})

describe('SalesUserList loading, empty and error states', () => {
  test('says so when the backend returned nothing', async () => {
    api.get('/api/company/salesuser/', paginated([]))
    const wrapper = await mountSalesList()

    expect(wrapper.text()).toContain('No sales users found')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/company/salesuser/', serverError)

    await mountSalesList()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading sales users')
  })
})

describe('SalesUserList delete', () => {
  test('deletes through the confirmation modal and refetches', async () => {
    const wrapper = await mountSalesList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-sales-user-modal').ok()
    await settle()

    const deleteSent = api.requests().find((sent) => sent.method === 'delete')
    expect(deleteSent).toMatchObject({ path: '/api/company/salesuser/11/' })
    expect(toasts().map((toast) => toast.body)).toContain('Sales user has been deleted')
    const listFetches = api.requests().filter((sent) => sent.method === 'get')
    expect(listFetches.length).toBeGreaterThan(1)
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountSalesList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })
})

async function mountSalesForm(props = {}) {
  const wrapper = mountForm(SalesUserForm, { deep: true, routes: userRoutes, props })
  await settle()
  return wrapper
}

async function fillCreate(wrapper) {
  // Type the name first, then let the debounced probe settle before filling
  // the rest: the save waits out the probe, and the suite must hand it a
  // settled verdict rather than an in-flight one.
  await wrapper.get('#salesuser_username').setValue('jan')
  await pastDebounce()
  await wrapper.vm.$nextTick()
  await wrapper.get('#salesuser_password1').setValue('secret-password')
  await wrapper.get('#salesuser_password2').setValue('secret-password')
  await wrapper.get('#salesuser_first_name').setValue('Jan')
  await wrapper.get('#salesuser_last_name').setValue('Jansen')
  await wrapper.get('#salesuser_email').setValue('jan@example.test')
  // The save waits out the debounced username probe: typing the name starts
  // its half-second window, so the fill must outlast it before submitting.
  // (The wait lives here rather than in submit() so refusal specs observe
  // the same settled verdict the happy path does.)
  await pastDebounce()
}

async function submit(wrapper) {
  const save = wrapper.findAll('button').find((button) => button.text() === 'Submit')
  await save.trigger('click')
  await settle()
  await wrapper.vm.$nextTick()
  await settle()
}

function refused(wrapper, text) {
  return wrapper
    .findAll('.invalid-feedback')
    .filter((node) => node.text().includes(text))
    .some((node) => node.classes('d-block'))
}

describe('SalesUserForm, creating a sales user', () => {
  test('opens on an empty form', async () => {
    const wrapper = await mountSalesForm()

    expect(wrapper.get('#salesuser_username').element.value).toBe('')
    expect(wrapper.get('#salesuser_first_name').element.value).toBe('')
  })

  test('confirms the creation and goes back', async () => {
    const wrapper = await mountSalesForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    const posts = api.requests().filter((sent) => sent.method === 'post')
    expect(toasts().map((toast) => toast.body)).toContain('sales user has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('the create body carries exactly the write schema’s fields', async () => {
    const wrapper = await mountSalesForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    const posts = api.requests().filter((sent) => sent.method === 'post')
    expect(posts).toHaveLength(1)
    // The legacy model posted password1/password2/id/full_name and the
    // counts; the parse output is the body now, so only schema fields ride.
    expect(Object.keys(posts[0].body).sort()).toEqual(
      ['email', 'first_name', 'last_name', 'password', 'sales_user', 'username'],
    )
    expect(posts[0].body.password).toBe('secret-password')
    expect(posts[0].body.sales_user).toEqual({
      uses_time_registration: false,
      contract_hours_week: '0.00',
    })
  })

  test('refuses an empty form, and sends nothing', async () => {
    const wrapper = await mountSalesForm()

    await submit(wrapper)

    expect(refused(wrapper, 'Username is required')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('refuses mismatched passwords, and sends nothing', async () => {
    const wrapper = await mountSalesForm()

    await fillCreate(wrapper)
    await wrapper.get('#salesuser_password2').setValue('something-else')
    await submit(wrapper)

    expect(refused(wrapper, 'Passwords do not match')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('tells the user when the create fails, and stays on the form', async () => {
    api.post('/api/company/salesuser/', serverError)
    const wrapper = await mountSalesForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating sales user')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('SalesUserForm, editing a sales user', () => {
  test('opens on the record it was given', async () => {
    const wrapper = await mountSalesForm({ pk: 11 })

    expect(wrapper.get('#salesuser_username').element.value).toBe('jan')
    expect(wrapper.get('#salesuser_first_name').element.value).toBe('Jan')
    expect(wrapper.get('#salesuser_email').element.value).toBe('jan@example.test')
  })

  test('saving patches without the display-only fields', async () => {
    const wrapper = await mountSalesForm({ pk: 11 })

    await wrapper.get('#salesuser_first_name').setValue('Jonathan')
    await submit(wrapper)

    const patches = api.requests().filter((sent) => sent.method === 'patch')
    expect(patches).toHaveLength(1)
    expect(patches[0].body).not.toHaveProperty('id')
    expect(patches[0].body).not.toHaveProperty('full_name')
    expect(patches[0].body).not.toHaveProperty('num_customers')
    expect(patches[0].body).not.toHaveProperty('date_joined')
    expect(patches[0].body).not.toHaveProperty('last_login')
    // An untouched password rides as absent, not as an empty string.
    expect(patches[0].body).not.toHaveProperty('password')
    expect(patches[0].body.first_name).toBe('Jonathan')
    expect(toasts().map((toast) => toast.body)).toContain('sales user has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a filled password rides the patch', async () => {
    const wrapper = await mountSalesForm({ pk: 11 })

    await wrapper.get('#salesuser_password1').setValue('new-secret')
    await wrapper.get('#salesuser_password2').setValue('new-secret')
    await submit(wrapper)

    const patches = api.requests().filter((sent) => sent.method === 'patch')
    expect(patches).toHaveLength(1)
    expect(patches[0].body.password).toBe('new-secret')
  })

  test('tells the user when the record cannot be fetched', async () => {
    api.get('/api/company/salesuser/{id}/', serverError)

    await mountSalesForm({ pk: 11 })

    expect(toasts().map((toast) => toast.body)).toContain('Error loading sales user')
  })

  test('tells the user when the update fails, and stays on the form', async () => {
    api.patch('/api/company/salesuser/{id}/', serverError)
    const wrapper = await mountSalesForm({ pk: 11 })

    await wrapper.get('#salesuser_first_name').setValue('Jonathan')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error updating sales user')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('SalesUserForm, cancelling', () => {
  test('goes back without sending anything', async () => {
    const wrapper = await mountSalesForm()

    await wrapper.get('#salesuser_username').setValue('jan')
    const cancel = wrapper.findAll('button').find((button) => button.text() === 'Cancel')
    await cancel.trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })
})

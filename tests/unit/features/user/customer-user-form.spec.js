import { beforeEach, describe, expect, test, vi } from 'vitest'

import { CustomerUserForm } from '@/features/user'
import { vCustomerAutocomplete, vCustomerUser } from '@/api/valibot.gen'

import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { userRoutes } from '../../support/user-routes.js'

/**
 * Behaviour characterisation for the customer-user form screen
 * (src/views/company/UserCustomerForm.vue), written BEFORE the user-slice
 * refactor. Everything here pins current behaviour; the converted screen
 * must reproduce it except where the ticket ledger declares otherwise.
 *
 * Seams under test: create vs edit wiring, the wire bodies (create posts the
 * whole model; edit PATCHes with the display-only and empty-password fields
 * stripped), the customer autocomplete + select + clear flow, the validation
 * gates, the username probe, the toasts and the go-back navigation.
 */

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const RECORD = fixtureFor(vCustomerUser, {
  id: 31,
  username: 'cust-jan',
  first_name: 'Jan',
  last_name: 'Klant',
  full_name: 'Jan Klant',
  email: 'cust-jan@example.test',
})

const AUTOCOMPLETE = [
  fixtureFor(vCustomerAutocomplete, {
    id: 5, name: 'Acme BV', address: 'Main 1', city: 'Amsterdam',
    contact: 'Jan', country_code: 'NL', email: 'info@acme.example', mobile: '06-12345678',
    postal: '1234 AB', tel: '020-1234567', value: 'Acme BV',
    customer_id: 'C-5', remarks: '', products_without_tax: false, branch_id: null,
  }),
  fixtureFor(vCustomerAutocomplete, {
    id: 6, name: 'Acme Holding BV', address: 'Coolsingel 1', city: 'Rotterdam',
    contact: 'Piet', country_code: 'NL', email: 'info@holding.example', mobile: '06-87654321',
    postal: '3011 AA', tel: '010-7654321', value: 'Acme Holding BV',
    customer_id: 'C-6', remarks: '', products_without_tax: false, branch_id: null,
  }),
]

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

beforeEach(() => {
  // The username probe asks the generated op, so its request lands on the
  // strict seam like every other read: answer it available here.
  api.get('/api/company/username-exists/', { available: true })
  api.get('/api/company/customeruser/', { count: 0, next: null, previous: null, results: [] })
  api.get('/api/company/customeruser/{id}/', RECORD)
  api.get('/api/customer/customer/autocomplete/', AUTOCOMPLETE)
  api.post('/api/company/customeruser/', RECORD)
  api.patch('/api/company/customeruser/{id}/', RECORD)
})

const multiselectStub = {
  props: ['options'],
  emits: ['select', 'search-change'],
  template: '<div />',
}

async function mountCustomerForm(props = {}) {
  const wrapper = mountForm(CustomerUserForm, {
    deep: true,
    routes: userRoutes,
    props,
    stubs: { VueMultiselect: multiselectStub },
  })
  await settle()
  return wrapper
}

function customerPicker(wrapper) {
  return wrapper.findAllComponents(multiselectStub)[0]
}

async function fillCreate(wrapper) {
  // Type the name first, then let the debounced probe settle before filling
  // the rest: the save waits out the probe, and the suite must hand it a
  // settled verdict rather than an in-flight one.
  await wrapper.get('#customeruser_username').setValue('cust-jan')
  await pastDebounce()
  await wrapper.vm.$nextTick()
  await wrapper.get('#customeruser_password').setValue('secret-password')
  await wrapper.get('#customeruser_password_again').setValue('secret-password')
  await wrapper.get('#customeruser_first_name').setValue('Jan')
  await wrapper.get('#customeruser_last_name').setValue('Klant')
  await wrapper.get('#customeruser_email').setValue('cust-jan@example.test')
  await wrapper.get('#customeruser_settings_group').setValue('default')
  // The save waits out the debounced username probe: typing the name starts
  // its half-second window, so the fill must outlast it before submitting.
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

describe('CustomerUserForm, creating a customer user', () => {
  test('opens on an empty form', async () => {
    const wrapper = await mountCustomerForm()

    expect(wrapper.get('#customeruser_username').element.value).toBe('')
    expect(wrapper.get('#customeruser_first_name').element.value).toBe('')
  })

  test('confirms the creation and goes back', async () => {
    const wrapper = await mountCustomerForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    const posts = api.requests().filter((sent) => sent.method === 'post')
    expect(toasts().map((toast) => toast.body)).toContain('Customer user has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('the create body carries exactly the write schema’s fields', async () => {
    const wrapper = await mountCustomerForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    const posts = api.requests().filter((sent) => sent.method === 'post')
    expect(posts).toHaveLength(1)
    // The legacy model posted password1/password2/id/full_name and
    // customer_details; the parse output is the body now, so only schema
    // fields ride.
    expect(Object.keys(posts[0].body).sort()).toEqual(
      ['customer_user', 'email', 'first_name', 'last_name', 'password', 'username'],
    )
    expect(posts[0].body.password).toBe('secret-password')
    expect(posts[0].body.customer_user).toEqual({ customer: null, settings_group: 'default' })
  })

  test('selecting a customer pins its id on the create', async () => {
    const wrapper = await mountCustomerForm()

    await fillCreate(wrapper)
    await customerPicker(wrapper).vm.$emit('select', {
      id: 5, name: 'Acme BV', address: 'Main 1', city: 'Amsterdam',
    })
    await submit(wrapper)

    const posts = api.requests().filter((sent) => sent.method === 'post')
    expect(posts).toHaveLength(1)
    expect(posts[0].body.customer_user.customer).toBe(5)
  })

  test('typing in the customer search hits the autocomplete', async () => {
    const wrapper = await mountCustomerForm()

    await customerPicker(wrapper).vm.$emit('search-change', 'acme')
    // The picker debounces the term exactly like the username probe: the
    // suite must outlast its window twice over — once for the debounced ref,
    // once for the query the function form enables off it.
    await pastDebounce()
    await settle()
    await pastDebounce()
    await settle()

    const searches = api.requests().filter((sent) => sent.path === '/api/customer/customer/autocomplete/')
    expect(searches).toHaveLength(1)
    expect(searches[0].query).toMatchObject({ q: 'acme' })
  })

  test('a failed customer search tells the user', async () => {
    api.get('/api/customer/customer/autocomplete/', serverError)
    const wrapper = await mountCustomerForm()

    await customerPicker(wrapper).vm.$emit('search-change', 'acme')
    await pastDebounce()
    await settle()
    await pastDebounce()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Error fetching customers')
  })

  test('refuses an empty form, and sends nothing', async () => {
    const wrapper = await mountCustomerForm()

    await submit(wrapper)

    expect(refused(wrapper, 'Username is required')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('refuses mismatched passwords, and sends nothing', async () => {
    const wrapper = await mountCustomerForm()

    await fillCreate(wrapper)
    await wrapper.get('#customeruser_password_again').setValue('something-else')
    await submit(wrapper)

    expect(refused(wrapper, 'Passwords do not match')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('tells the user when the create fails, and stays on the form', async () => {
    api.post('/api/company/customeruser/', serverError)
    const wrapper = await mountCustomerForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating customer user')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('CustomerUserForm, editing a customer user', () => {
  test('opens on the record it was given, with the customer line', async () => {
    // The edit read carries customer_details; the form renders the display
    // line from it without a second request.
    api.get('/api/company/customeruser/{id}/', fixtureFor(vCustomerUser, {
      id: 31,
      username: 'cust-jan',
      first_name: 'Jan',
      last_name: 'Klant',
      full_name: 'Jan Klant',
      email: 'cust-jan@example.test',
      customer_user: { customer: 5, settings_group: 'default' },
      customer_details: { id: 5, name: 'Acme BV', address: 'Main 1', city: 'Amsterdam' },
    }))
    const wrapper = await mountCustomerForm({ pk: 31 })

    expect(wrapper.get('#customeruser_username').element.value).toBe('cust-jan')
    expect(wrapper.get('#customeruser_customer').element.value).toBe('Acme BV, Main 1, Amsterdam')
  })

  test('saving patches without the display-only fields', async () => {
    const wrapper = await mountCustomerForm({ pk: 31 })

    await wrapper.get('#customeruser_first_name').setValue('Jonathan')
    await submit(wrapper)

    const patches = api.requests().filter((sent) => sent.method === 'patch')
    expect(patches).toHaveLength(1)
    expect(patches[0].body).not.toHaveProperty('id')
    expect(patches[0].body).not.toHaveProperty('full_name')
    expect(patches[0].body).not.toHaveProperty('customer_details')
    expect(patches[0].body).not.toHaveProperty('date_joined')
    expect(patches[0].body).not.toHaveProperty('last_login')
    // An untouched password rides as absent, not as an empty string.
    expect(patches[0].body).not.toHaveProperty('password')
    expect(patches[0].body.first_name).toBe('Jonathan')
    // The customer link round-trips on the patch.
    expect(patches[0].body.customer_user.customer).toBeNull()
    expect(toasts().map((toast) => toast.body)).toContain('Customer user has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a filled password rides the patch', async () => {
    const wrapper = await mountCustomerForm({ pk: 31 })

    await wrapper.get('#customeruser_password').setValue('new-secret')
    await wrapper.get('#customeruser_password_again').setValue('new-secret')
    await submit(wrapper)

    const patches = api.requests().filter((sent) => sent.method === 'patch')
    expect(patches).toHaveLength(1)
    expect(patches[0].body.password).toBe('new-secret')
  })

  test('tells the user when the record cannot be fetched', async () => {
    api.get('/api/company/customeruser/{id}/', serverError)

    await mountCustomerForm({ pk: 31 })

    expect(toasts().map((toast) => toast.body)).toContain('Error loading customer user')
  })

  test('tells the user when the update fails, and stays on the form', async () => {
    api.patch('/api/company/customeruser/{id}/', serverError)
    const wrapper = await mountCustomerForm({ pk: 31 })

    await wrapper.get('#customeruser_first_name').setValue('Jonathan')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error updating customer user')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('CustomerUserForm, cancelling', () => {
  test('goes back without sending anything', async () => {
    const wrapper = await mountCustomerForm()

    await wrapper.get('#customeruser_username').setValue('cust-jan')
    const cancel = wrapper.findAll('button').find((button) => button.text() === 'Cancel')
    await cancel.trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })
})

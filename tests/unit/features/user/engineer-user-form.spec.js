import { beforeEach, describe, expect, test, vi } from 'vitest'

import EngineerUserForm from '@/features/user/engineer/EngineerUserForm.vue'
import PriceInput from '@/components/PriceInput.vue'
import { vEngineer, vStockLocation, vStockLocationCreateUpdate } from '@/api/valibot.gen'

import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { userRoutes } from '../../support/user-routes.js'

/**
 * Behaviour characterisation for the engineer-user form screen
 * (src/views/company/UserEngineerForm.vue). Everything here pins the legacy
 * behaviour; the converted screen reproduces it except where the ticket
 * ledger declares otherwise (URL-state search is the list's; here: the parse
 * output is the body, the username probe is debounced, the taken-username
 * refusal waits out the actual in-flight probe).
 *
 * Seams under test: create vs edit wiring, the wire bodies (create posts the
 * parse output; edit PATCHes with the display-only and empty-password fields
 * stripped), the hourly-rate PriceInput handoff, the preferred-location
 * picker plus the create-location flow, the validation gates, the username
 * probe, the toasts and the go-back navigation.
 */

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const RECORD = fixtureFor(vEngineer, {
  id: 41,
  username: 'eng-jan',
  first_name: 'Jan',
  last_name: 'Monteur',
  full_name: 'Jan Monteur',
  email: 'eng-jan@example.test',
  engineer: {
    mobile: '+31612345678',
    hourly_rate: '25.00',
    hourly_rate_currency: 'EUR',
    preferred_location: 7,
  },
})

const LOCATIONS = [
  fixtureFor(vStockLocation, { id: 7, name: 'Depot Amsterdam' }),
  fixtureFor(vStockLocation, { id: 8, name: 'Depot Rotterdam' }),
]

const NEW_LOCATION = fixtureFor(vStockLocationCreateUpdate, { id: 9, name: 'Depot Noord' })

const COUNTRIES = [{ value: 'NL', text: 'Nederland' }]

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

beforeEach(() => {
  // The username probe asks the generated op, so its request lands on the
  // strict seam like every other read: answer it available here.
  api.get('/api/company/username-exists/', { available: true })
  api.get('/api/company/engineer/', { count: 0, next: null, previous: null, results: [] })
  api.get('/api/company/engineer/{id}/', RECORD)
  api.get('/api/inventory/stock-location/', paginated(LOCATIONS))
  api.post('/api/company/engineer/', RECORD)
  api.post('/api/inventory/stock-location/', NEW_LOCATION)
  api.patch('/api/company/engineer/{id}/', RECORD)
})

async function mountEngineerForm(props = {}) {
  const wrapper = mountForm(EngineerUserForm, {
    deep: true,
    routes: userRoutes,
    props,
    main: { getCountries: COUNTRIES },
  })
  await settle()
  return wrapper
}

async function fillCreate(wrapper) {
  // Type the name first, then let the debounced probe settle before filling
  // the rest: the save waits out the probe, and the suite must hand it a
  // settled verdict rather than an in-flight one.
  await wrapper.get('#engineer_username').setValue('eng-jan')
  await pastDebounce()
  await wrapper.vm.$nextTick()
  await wrapper.get('#engineer_password').setValue('secret-password')
  await wrapper.get('#engineer_password_again').setValue('secret-password')
  await wrapper.get('#engineer_first_name').setValue('Jan')
  await wrapper.get('#engineer_last_name').setValue('Monteur')
  await wrapper.get('#engineer_email').setValue('eng-jan@example.test')
  await wrapper.get('#engineer_mobile').setValue('+31612345678')
  // A raw setValue on the select does not resolve the option's bound id the
  // way a user pick does; select the option itself.
  await wrapper.get('#engineer_preferred_location option[value="7"]').setSelected()
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

function engineerPosts() {
  return api.requests().filter((sent) => sent.method === 'post' && sent.path === '/api/company/engineer/')
}

describe('EngineerUserForm, creating an engineer', () => {
  test('opens on an empty form', async () => {
    const wrapper = await mountEngineerForm()

    expect(wrapper.get('#engineer_username').element.value).toBe('')
    expect(wrapper.get('#engineer_first_name').element.value).toBe('')
    expect(wrapper.get('#engineer_mobile').element.value).toBe('')
  })

  test('confirms the creation and goes back', async () => {
    const wrapper = await mountEngineerForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Engineer has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('the create body carries exactly the write schema’s fields', async () => {
    const wrapper = await mountEngineerForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    const posts = engineerPosts()
    expect(posts).toHaveLength(1)
    // The legacy model posted password1/password2/id/full_name and the
    // counts; the parse output is the body now, so only schema fields ride.
    expect(Object.keys(posts[0].body).sort()).toEqual(
      ['email', 'engineer', 'first_name', 'last_name', 'password', 'username'],
    )
    expect(posts[0].body.password).toBe('secret-password')
    expect(posts[0].body.engineer.mobile).toBe('+31612345678')
    expect(posts[0].body.engineer.preferred_location).toBe(7)
    expect(posts[0].body.engineer.hourly_rate).toBe('0.00')
  })

  test('the hourly rate rides the create through the PriceInput', async () => {
    const wrapper = await mountEngineerForm()

    await fillCreate(wrapper)
    await wrapper.findComponent(PriceInput).vm.$emit('priceChanged', {
      toFormat: () => '12.50',
    })
    await submit(wrapper)

    const posts = engineerPosts()
    expect(posts).toHaveLength(1)
    expect(posts[0].body.engineer.hourly_rate).toBe('12.50')
  })

  test('the location picker lists the stock locations', async () => {
    const wrapper = await mountEngineerForm()

    expect(wrapper.get('#engineer_preferred_location').text()).toContain('Depot Amsterdam')
    expect(wrapper.get('#engineer_preferred_location').text()).toContain('Depot Rotterdam')
  })

  test('creating a location posts its name and pins it as the preferred location', async () => {
    const wrapper = await mountEngineerForm()

    await fillCreate(wrapper)
    await wrapper.get('#engineer_preferred_location_new').setValue('Depot Noord')
    const createButton = wrapper.findAll('button').find((button) => button.text() === 'Create')
    await createButton.trigger('click')
    await settle()

    const locationPosts = api.requests().filter(
      (sent) => sent.method === 'post' && sent.path === '/api/inventory/stock-location/',
    )
    expect(locationPosts).toHaveLength(1)
    expect(locationPosts[0].body).toEqual({ name: 'Depot Noord' })

    await submit(wrapper)

    const posts = engineerPosts()
    expect(posts).toHaveLength(1)
    expect(posts[0].body.engineer.preferred_location).toBe(9)
  })

  test('the location create stays disabled for an empty name', async () => {
    const wrapper = await mountEngineerForm()

    const createButton = wrapper.findAll('button').find((button) => button.text() === 'Create')
    expect(createButton.attributes('disabled')).toBeDefined()
  })

  test('refuses an empty form, and sends nothing', async () => {
    const wrapper = await mountEngineerForm()

    await submit(wrapper)

    expect(refused(wrapper, 'Username is required')).toBe(true)
    expect(refused(wrapper, 'Please select a preferred location')).toBe(true)
    expect(engineerPosts()).toEqual([])
  })

  test('refuses mismatched passwords, and sends nothing', async () => {
    const wrapper = await mountEngineerForm()

    await fillCreate(wrapper)
    await wrapper.get('#engineer_password_again').setValue('something-else')
    await submit(wrapper)

    expect(refused(wrapper, 'Passwords do not match')).toBe(true)
    expect(engineerPosts()).toEqual([])
  })

  test('tells the user when the create fails, and stays on the form', async () => {
    api.post('/api/company/engineer/', serverError)
    const wrapper = await mountEngineerForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating engineer')
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('tells the user when the locations cannot be fetched', async () => {
    api.get('/api/inventory/stock-location/', serverError)

    await mountEngineerForm()

    expect(toasts().map((toast) => toast.body)).toContain('Error fetching locations')
  })

  test('tells the user when the location create fails', async () => {
    api.post('/api/inventory/stock-location/', serverError)
    const wrapper = await mountEngineerForm()

    await wrapper.get('#engineer_preferred_location_new').setValue('Depot Noord')
    const createButton = wrapper.findAll('button').find((button) => button.text() === 'Create')
    await createButton.trigger('click')
    await settle()
    await wrapper.vm.$nextTick()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Error creating new location')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('EngineerUserForm, editing an engineer', () => {
  test('opens on the record it was given', async () => {
    const wrapper = await mountEngineerForm({ pk: 41 })

    expect(wrapper.get('#engineer_username').element.value).toBe('eng-jan')
    expect(wrapper.get('#engineer_first_name').element.value).toBe('Jan')
    expect(wrapper.get('#engineer_email').element.value).toBe('eng-jan@example.test')
    expect(wrapper.get('#engineer_mobile').element.value).toBe('+31612345678')
    expect(wrapper.get('#engineer_preferred_location').element.value).toBe('7')
  })

  test('saving patches without the display-only fields', async () => {
    const wrapper = await mountEngineerForm({ pk: 41 })

    await wrapper.get('#engineer_first_name').setValue('Jonathan')
    await submit(wrapper)

    const patches = api.requests().filter((sent) => sent.method === 'patch')
    expect(patches).toHaveLength(1)
    expect(patches[0].body).not.toHaveProperty('id')
    expect(patches[0].body).not.toHaveProperty('full_name')
    expect(patches[0].body).not.toHaveProperty('user_sick')
    expect(patches[0].body).not.toHaveProperty('date_joined')
    expect(patches[0].body).not.toHaveProperty('last_login')
    // An untouched password rides as absent, not as an empty string.
    expect(patches[0].body).not.toHaveProperty('password')
    expect(patches[0].body.first_name).toBe('Jonathan')
    // The nested record round-trips on the patch.
    expect(patches[0].body.engineer.preferred_location).toBe(7)
    expect(patches[0].body.engineer.hourly_rate).toBe('25.00')
    expect(toasts().map((toast) => toast.body)).toContain('Engineer has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a filled password rides the patch', async () => {
    const wrapper = await mountEngineerForm({ pk: 41 })

    await wrapper.get('#engineer_password').setValue('new-secret')
    await wrapper.get('#engineer_password_again').setValue('new-secret')
    await submit(wrapper)

    const patches = api.requests().filter((sent) => sent.method === 'patch')
    expect(patches).toHaveLength(1)
    expect(patches[0].body.password).toBe('new-secret')
  })

  test('tells the user when the record cannot be fetched', async () => {
    api.get('/api/company/engineer/{id}/', serverError)

    await mountEngineerForm({ pk: 41 })

    expect(toasts().map((toast) => toast.body)).toContain('Error loading engineer')
  })

  test('tells the user when the update fails, and stays on the form', async () => {
    api.patch('/api/company/engineer/{id}/', serverError)
    const wrapper = await mountEngineerForm({ pk: 41 })

    await wrapper.get('#engineer_first_name').setValue('Jonathan')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error updating engineer')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('EngineerUserForm, cancelling', () => {
  test('goes back without sending anything', async () => {
    const wrapper = await mountEngineerForm()

    await wrapper.get('#engineer_username').setValue('eng-jan')
    const cancel = wrapper.findAll('button').find((button) => button.text() === 'Cancel')
    await cancel.trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(engineerPosts()).toEqual([])
  })
})

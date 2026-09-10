import { beforeEach, describe, expect, test, vi } from 'vitest'

import ApiUserForm from '@/features/user/api/ApiUserForm.vue'
import { vApiUser } from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { userRoutes } from '../../support/user-routes.js'

/**
 * Behaviour characterisation for the API-user form screen
 * (src/views/company/UserApiForm.vue), written BEFORE the user-slice
 * refactor. Everything here pins current behaviour; the converted screen
 * must reproduce it except where the ticket ledger declares otherwise.
 *
 * Seams under test: create vs edit wiring, the wire bodies (create posts the
 * write schema's fields with the date stamped and password1 as `password`;
 * edit PATCHes with the read-only token companions and an untouched password
 * stripped), the validation gates, the username probe, the toasts and the
 * go-back navigation.
 */

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const RECORD = fixtureFor(vApiUser, {
  id: 41,
  username: 'api-jan',
  api_user: {
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Jan integration',
    token: 'tok-active-1',
    expire_start_dt: '2026-01-01T00:00:00Z',
    expire_in_days: 30,
    token_is_revoked: false,
  },
})

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

beforeEach(() => {
  // The username probe asks the generated op, so its request lands on the
  // strict seam like every other read: answer it available here.
  api.get('/api/company/username-exists/', { available: true })
  api.get('/api/company/apiuser/', { count: 0, next: null, previous: null, results: [] })
  api.get('/api/company/apiuser/{id}/', RECORD)
  api.post('/api/company/apiuser/', RECORD)
  api.patch('/api/company/apiuser/{id}/', RECORD)
})

async function mountApiUserForm(props = {}) {
  const wrapper = mountForm(ApiUserForm, { deep: true, routes: userRoutes, props })
  await settle()
  return wrapper
}

async function fillCreate(wrapper) {
  // Type the name first, then let the debounced probe settle before filling
  // the rest: the save waits out the probe, and the suite must hand it a
  // settled verdict rather than an in-flight one.
  await wrapper.get('#apiuser_username').setValue('api-jan')
  await pastDebounce()
  await wrapper.vm.$nextTick()
  await wrapper.get('#apiuser_password').setValue('secret-password')
  await wrapper.get('#apiuser_password_again').setValue('secret-password')
  await wrapper.get('#apiuser_name').setValue('Jan integration')
  await wrapper.get('#apiuser_expire_start_dt').setValue('2026-01-01')
  await wrapper.get('#apiuser_expire_in_days').setValue('365')
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

describe('ApiUserForm, creating an API user', () => {
  test('opens on an empty form', async () => {
    const wrapper = await mountApiUserForm()

    expect(wrapper.get('#apiuser_username').element.value).toBe('')
    expect(wrapper.get('#apiuser_name').element.value).toBe('')
  })

  test('confirms the creation and goes back', async () => {
    const wrapper = await mountApiUserForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('API user has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('the create body carries exactly the write schema’s fields', async () => {
    const wrapper = await mountApiUserForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    const posts = api.requests().filter((sent) => sent.method === 'post')
    expect(posts).toHaveLength(1)
    // The legacy model posted password1/password2; the parse output is the
    // body now, so password1 rides under its wire name and the read-only
    // token companions never ride at all.
    expect(Object.keys(posts[0].body).sort()).toEqual(['api_user', 'password', 'username'])
    expect(posts[0].body.password).toBe('secret-password')
    expect(posts[0].body.api_user).toEqual({
      name: 'Jan integration',
      expire_start_dt: '2026-01-01T00:00:00Z',
      expire_in_days: 365,
    })
  })

  test('refuses an empty form, and sends nothing', async () => {
    const wrapper = await mountApiUserForm()

    await submit(wrapper)

    expect(refused(wrapper, 'Username is required')).toBe(true)
    expect(refused(wrapper, 'Name is required')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('refuses mismatched passwords, and sends nothing', async () => {
    const wrapper = await mountApiUserForm()

    await fillCreate(wrapper)
    await wrapper.get('#apiuser_password_again').setValue('something-else')
    await submit(wrapper)

    expect(refused(wrapper, 'Passwords do not match')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('refuses a taken username, and sends nothing', async () => {
    api.get('/api/company/username-exists/', { available: false })
    const wrapper = await mountApiUserForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    expect(refused(wrapper, 'Username is already in use')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('tells the user when the create fails, and stays on the form', async () => {
    api.post('/api/company/apiuser/', serverError)
    const wrapper = await mountApiUserForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating API user')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('ApiUserForm, editing an API user', () => {
  test('opens on the record it was given, with the day part of the start', async () => {
    const wrapper = await mountApiUserForm({ pk: 41 })

    expect(wrapper.get('#apiuser_username').element.value).toBe('api-jan')
    expect(wrapper.get('#apiuser_name').element.value).toBe('Jan integration')
    expect(wrapper.get('#apiuser_expire_start_dt').element.value).toBe('2026-01-01')
    expect(wrapper.get('#apiuser_expire_in_days').element.value).toBe('30')
  })

  test('saving patches without the read-only companions', async () => {
    const wrapper = await mountApiUserForm({ pk: 41 })

    await wrapper.get('#apiuser_name').setValue('Jan renamed')
    await submit(wrapper)

    const patches = api.requests().filter((sent) => sent.method === 'patch')
    expect(patches).toHaveLength(1)
    expect(patches[0].body).not.toHaveProperty('id')
    // An untouched password rides as absent, not as an empty string.
    expect(patches[0].body).not.toHaveProperty('password')
    expect(patches[0].body).not.toHaveProperty('password1')
    expect(patches[0].body).not.toHaveProperty('password2')
    // The token, its revocation flag and the uuid are read-only: the legacy
    // edit round-tripped them, the parse drops them.
    expect(Object.keys(patches[0].body.api_user).sort()).toEqual(
      ['expire_in_days', 'expire_start_dt', 'name'],
    )
    expect(patches[0].body.api_user.name).toBe('Jan renamed')
    expect(toasts().map((toast) => toast.body)).toContain('API user has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a filled password rides the patch', async () => {
    const wrapper = await mountApiUserForm({ pk: 41 })

    await wrapper.get('#apiuser_password').setValue('new-secret')
    await wrapper.get('#apiuser_password_again').setValue('new-secret')
    await submit(wrapper)

    const patches = api.requests().filter((sent) => sent.method === 'patch')
    expect(patches).toHaveLength(1)
    expect(patches[0].body.password).toBe('new-secret')
  })

  test('tells the user when the record cannot be fetched', async () => {
    api.get('/api/company/apiuser/{id}/', serverError)

    await mountApiUserForm({ pk: 41 })

    expect(toasts().map((toast) => toast.body)).toContain('Error loading API user')
  })

  test('tells the user when the update fails, and stays on the form', async () => {
    api.patch('/api/company/apiuser/{id}/', serverError)
    const wrapper = await mountApiUserForm({ pk: 41 })

    await wrapper.get('#apiuser_name').setValue('Jan renamed')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error updating API user')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('ApiUserForm, cancelling', () => {
  test('goes back without sending anything', async () => {
    const wrapper = await mountApiUserForm()

    await wrapper.get('#apiuser_username').setValue('api-jan')
    const cancel = wrapper.findAll('button').find((button) => button.text() === 'Cancel')
    await cancel.trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })
})

import { beforeEach, describe, expect, test, vi } from 'vitest'

import { PlanningUserForm } from '@/features/user'
import { vPlanningUser } from '@/api/valibot.gen'

import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, mountListView, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { userRoutes } from '../../support/user-routes.js'

/**
 * Behaviour characterisation for the planning-user form screen
 * (src/views/company/UserPlanningForm.vue), written BEFORE the user-slice
 * refactor. Everything here pins current behaviour; the converted screen
 * must reproduce it except where the ticket ledger declares otherwise.
 *
 * Seams under test: create vs edit wiring, the wire bodies (create posts the
 * whole model; edit PATCHes with the display-only and empty-password fields
 * stripped), the validation gates, the username probe, the toasts and the
 * go-back navigation.
 */

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const RECORD = fixtureFor(vPlanningUser, {
  id: 21,
  username: 'plan-jan',
  first_name: 'Jan',
  last_name: 'Planner',
  full_name: 'Jan Planner',
  email: 'plan-jan@example.test',
})

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

const api = installApiSeam()

beforeEach(() => {
  // The username probe asks the generated op, so its request lands on the
  // strict seam like every other read: answer it available here.
  api.get('/api/company/username-exists/', { available: true })
  api.get('/api/company/planninguser/', { count: 0, next: null, previous: null, results: [] })
  api.get('/api/company/planninguser/{id}/', RECORD)
  api.post('/api/company/planninguser/', RECORD)
  api.patch('/api/company/planninguser/{id}/', RECORD)
})

async function mountPlanningForm(props = {}) {
  const wrapper = mountForm(PlanningUserForm, { deep: true, routes: userRoutes, props })
  await settle()
  return wrapper
}

async function fillCreate(wrapper) {
  // Type the name first, then let the debounced probe settle before filling
  // the rest: the save waits out the probe, and the suite must hand it a
  // settled verdict rather than an in-flight one.
  await wrapper.get('#planninguser_username').setValue('plan-jan')
  await pastDebounce()
  await wrapper.vm.$nextTick()
  await wrapper.get('#planninguser_password1').setValue('secret-password')
  await wrapper.get('#planninguser_password2').setValue('secret-password')
  await wrapper.get('#planninguser_first_name').setValue('Jan')
  await wrapper.get('#planninguser_last_name').setValue('Planner')
  await wrapper.get('#planninguser_email').setValue('plan-jan@example.test')
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

describe('PlanningUserForm, creating a planning user', () => {
  test('opens on an empty form', async () => {
    const wrapper = await mountPlanningForm()

    expect(wrapper.get('#planninguser_username').element.value).toBe('')
    expect(wrapper.get('#planninguser_first_name').element.value).toBe('')
  })

  test('confirms the creation and goes back', async () => {
    const wrapper = await mountPlanningForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    const posts = api.requests().filter((sent) => sent.method === 'post')
    expect(toasts().map((toast) => toast.body)).toContain('planning user has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('the create body carries exactly the write schema’s fields', async () => {
    const wrapper = await mountPlanningForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    const posts = api.requests().filter((sent) => sent.method === 'post')
    expect(posts).toHaveLength(1)
    // The legacy model posted password1/password2/id/full_name; the parse
    // output is the body now, so only schema fields ride.
    expect(Object.keys(posts[0].body).sort()).toEqual(
      ['email', 'first_name', 'last_name', 'password', 'planning_user', 'username'],
    )
    expect(posts[0].body.password).toBe('secret-password')
    expect(posts[0].body.planning_user).toEqual({
      uses_time_registration: false,
      contract_hours_week: '0.00',
    })
  })

  test('refuses an empty form, and sends nothing', async () => {
    const wrapper = await mountPlanningForm()

    await submit(wrapper)

    expect(refused(wrapper, 'Please enter a username')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('refuses mismatched passwords, and sends nothing', async () => {
    const wrapper = await mountPlanningForm()

    await fillCreate(wrapper)
    await wrapper.get('#planninguser_password2').setValue('something-else')
    await submit(wrapper)

    expect(refused(wrapper, 'Passwords do not match')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('tells the user when the create fails, and stays on the form', async () => {
    api.post('/api/company/planninguser/', serverError)
    const wrapper = await mountPlanningForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating planning user')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('PlanningUserForm, editing a planning user', () => {
  test('opens on the record it was given', async () => {
    const wrapper = await mountPlanningForm({ pk: 21 })

    expect(wrapper.get('#planninguser_username').element.value).toBe('plan-jan')
    expect(wrapper.get('#planninguser_first_name').element.value).toBe('Jan')
    expect(wrapper.get('#planninguser_email').element.value).toBe('plan-jan@example.test')
  })

  test('saving patches without the display-only fields', async () => {
    const wrapper = await mountPlanningForm({ pk: 21 })

    await wrapper.get('#planninguser_first_name').setValue('Jonathan')
    await submit(wrapper)

    const patches = api.requests().filter((sent) => sent.method === 'patch')
    expect(patches).toHaveLength(1)
    expect(patches[0].body).not.toHaveProperty('id')
    expect(patches[0].body).not.toHaveProperty('full_name')
    expect(patches[0].body).not.toHaveProperty('date_joined')
    expect(patches[0].body).not.toHaveProperty('last_login')
    // An untouched password rides as absent, not as an empty string.
    expect(patches[0].body).not.toHaveProperty('password')
    expect(patches[0].body.first_name).toBe('Jonathan')
    expect(toasts().map((toast) => toast.body)).toContain('planning user has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a filled password rides the patch', async () => {
    const wrapper = await mountPlanningForm({ pk: 21 })

    await wrapper.get('#planninguser_password1').setValue('new-secret')
    await wrapper.get('#planninguser_password2').setValue('new-secret')
    await submit(wrapper)

    const patches = api.requests().filter((sent) => sent.method === 'patch')
    expect(patches).toHaveLength(1)
    expect(patches[0].body.password).toBe('new-secret')
  })

  test('tells the user when the record cannot be fetched', async () => {
    api.get('/api/company/planninguser/{id}/', serverError)

    await mountPlanningForm({ pk: 21 })

    expect(toasts().map((toast) => toast.body)).toContain('Error loading planning user')
  })

  test('tells the user when the update fails, and stays on the form', async () => {
    api.patch('/api/company/planninguser/{id}/', serverError)
    const wrapper = await mountPlanningForm({ pk: 21 })

    await wrapper.get('#planninguser_first_name').setValue('Jonathan')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error updating planning user')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('PlanningUserForm, cancelling', () => {
  test('goes back without sending anything', async () => {
    const wrapper = await mountPlanningForm()

    await wrapper.get('#planninguser_username').setValue('plan-jan')
    const cancel = wrapper.findAll('button').find((button) => button.text() === 'Cancel')
    await cancel.trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })
})

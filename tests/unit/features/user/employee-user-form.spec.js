import { beforeEach, describe, expect, test, vi } from 'vitest'

import EmployeeUserForm from '@/features/user/employee/EmployeeUserForm.vue'
import { vBranch, vEmployeeUser } from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { userRoutes } from '../../support/user-routes.js'

/**
 * Behaviour characterisation for the employee-user form screen
 * (src/views/company/UserEmployeeForm.vue), written BEFORE the user-slice
 * refactor. Everything here pins current behaviour; the converted screen
 * must reproduce it except where the ticket ledger declares otherwise.
 *
 * Seams under test: create vs edit wiring, the wire bodies (create posts the
 * whole model; edit PATCHes with the display-only and empty-password fields
 * stripped), the branch picker and the branch-employee pinning, the
 * validation gates, the username probe, the toasts and the go-back
 * navigation.
 */

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const RECORD = fixtureFor(vEmployeeUser, {
  id: 31,
  username: 'emp-jan',
  first_name: 'Jan',
  last_name: 'Employee',
  full_name: 'Jan Employee',
  email: 'emp-jan@example.test',
  employee_user: {
    uses_time_registration: true,
    contract_hours_week: '38.00',
    branch: null,
  },
})

const BRANCHES = {
  count: 2,
  next: null,
  previous: null,
  results: [
    fixtureFor(vBranch, { id: 7, name: 'Rotterdam', city: 'Rotterdam' }),
    fixtureFor(vBranch, { id: 8, name: 'Amsterdam', city: 'Amsterdam' }),
  ],
}

const MY_BRANCH = fixtureFor(vBranch, { id: 7, name: 'Rotterdam', city: 'Rotterdam' })

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

const api = installApiSeam()

beforeEach(() => {
  // The username probe asks the generated op, so its request lands on the
  // strict seam like every other read: answer it available here.
  api.get('/api/company/username-exists/', { available: true })
  api.get('/api/company/employeeuser/', { count: 0, next: null, previous: null, results: [] })
  api.get('/api/company/employeeuser/{id}/', RECORD)
  api.post('/api/company/employeeuser/', RECORD)
  api.patch('/api/company/employeeuser/{id}/', RECORD)
  api.get('/api/company/branch/', BRANCHES)
  api.get('/api/company/branch-my/', MY_BRANCH)
})

async function mountEmployeeForm(props = {}, { main = { getMemberHasBranches: false }, auth = {} } = {}) {
  const wrapper = mountForm(EmployeeUserForm, { deep: true, routes: userRoutes, props, main, auth })
  await settle()
  return wrapper
}

async function fillCreate(wrapper) {
  // Type the name first, then let the debounced probe settle before filling
  // the rest: the save waits out the probe, and the suite must hand it a
  // settled verdict rather than an in-flight one.
  await wrapper.get('#employee_username').setValue('emp-jan')
  await pastDebounce()
  await wrapper.vm.$nextTick()
  await wrapper.get('#employee_password1').setValue('secret-password')
  await wrapper.get('#employee_password2').setValue('secret-password')
  await wrapper.get('#employee_first_name').setValue('Jan')
  await wrapper.get('#employee_last_name').setValue('Employee')
  await wrapper.get('#employee_email').setValue('emp-jan@example.test')
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

describe('EmployeeUserForm, creating an employee', () => {
  test('opens on an empty form', async () => {
    const wrapper = await mountEmployeeForm()

    expect(wrapper.get('#employee_username').element.value).toBe('')
    expect(wrapper.get('#employee_first_name').element.value).toBe('')
  })

  test('confirms the creation and goes back', async () => {
    const wrapper = await mountEmployeeForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('employee has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('the create body carries exactly the write schema’s fields', async () => {
    const wrapper = await mountEmployeeForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    const posts = api.requests().filter((sent) => sent.method === 'post')
    expect(posts).toHaveLength(1)
    // The legacy model posted password1/password2/id/full_name; the parse
    // output is the body now, so only schema fields ride.
    expect(Object.keys(posts[0].body).sort()).toEqual(
      ['email', 'employee_user', 'first_name', 'last_name', 'password', 'username'],
    )
    expect(posts[0].body.password).toBe('secret-password')
    expect(posts[0].body.employee_user).toEqual({
      contract_hours_week: '0.00',
      branch: null,
    })
  })

  test('refuses an empty form, and sends nothing', async () => {
    const wrapper = await mountEmployeeForm()

    await submit(wrapper)

    expect(refused(wrapper, 'Please enter a username')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('refuses mismatched passwords, and sends nothing', async () => {
    const wrapper = await mountEmployeeForm()

    await fillCreate(wrapper)
    await wrapper.get('#employee_password2').setValue('something-else')
    await submit(wrapper)

    expect(refused(wrapper, 'Passwords do not match')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('tells the user when the create fails, and stays on the form', async () => {
    api.post('/api/company/employeeuser/', serverError)
    const wrapper = await mountEmployeeForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating employee')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('EmployeeUserForm, editing an employee', () => {
  test('opens on the record it was given', async () => {
    const wrapper = await mountEmployeeForm({ pk: 31 })

    expect(wrapper.get('#employee_username').element.value).toBe('emp-jan')
    expect(wrapper.get('#employee_first_name').element.value).toBe('Jan')
    expect(wrapper.get('#employee_email').element.value).toBe('emp-jan@example.test')
    expect(wrapper.get('#employee_contract_hours_week').element.value).toBe('38.00')
  })

  test('saving patches without the display-only fields', async () => {
    const wrapper = await mountEmployeeForm({ pk: 31 })

    await wrapper.get('#employee_first_name').setValue('Jonathan')
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
    expect(toasts().map((toast) => toast.body)).toContain('employee has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a filled password rides the patch', async () => {
    const wrapper = await mountEmployeeForm({ pk: 31 })

    await wrapper.get('#employee_password1').setValue('new-secret')
    await wrapper.get('#employee_password2').setValue('new-secret')
    await submit(wrapper)

    const patches = api.requests().filter((sent) => sent.method === 'patch')
    expect(patches).toHaveLength(1)
    expect(patches[0].body.password).toBe('new-secret')
  })

  test('tells the user when the record cannot be fetched', async () => {
    api.get('/api/company/employeeuser/{id}/', serverError)

    await mountEmployeeForm({ pk: 31 })

    expect(toasts().map((toast) => toast.body)).toContain('Error loading employee')
  })

  test('tells the user when the update fails, and stays on the form', async () => {
    api.patch('/api/company/employeeuser/{id}/', serverError)
    const wrapper = await mountEmployeeForm({ pk: 31 })

    await wrapper.get('#employee_first_name').setValue('Jonathan')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error updating employee')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('EmployeeUserForm, branches', () => {
  test('offers no branch picker on a tenant without branches', async () => {
    const wrapper = await mountEmployeeForm()

    expect(wrapper.find('#employee_branch').exists()).toBe(false)
  })

  test('offers the branches with an empty option on a branched tenant', async () => {
    const wrapper = await mountEmployeeForm({}, { main: { getMemberHasBranches: true } })

    const select = wrapper.get('#employee_branch')
    const options = select.findAll('option').map((option) => option.text())
    expect(options).toContain('-')
    expect(options).toContain('Rotterdam - Rotterdam')
    expect(options).toContain('Amsterdam - Amsterdam')
  })

  test('a picked branch rides the create body', async () => {
    const wrapper = await mountEmployeeForm({}, { main: { getMemberHasBranches: true } })

    await fillCreate(wrapper)
    // Drive the option itself, as a user pick does: `setValue` on the select
    // stringifies through the DOM and loses the raw numeric `_value` Vue
    // keeps on each bound option, while `setSelected` hands v-model the `7`.
    const rotterdam = wrapper.get('#employee_branch').findAll('option')
      .find((option) => option.element.value === '7')
    await rotterdam.setSelected()
    await submit(wrapper)

    const posts = api.requests().filter((sent) => sent.method === 'post')
    expect(posts).toHaveLength(1)
    expect(posts[0].body.employee_user.branch).toBe(7)
  })

  test('a branch employee sees their own branch and files under it', async () => {
    const wrapper = await mountEmployeeForm(
      {},
      { main: { getMemberHasBranches: true }, auth: { isBranchEmployee: true } },
    )

    expect(wrapper.get('#employee_branch').element.value).toBe('Rotterdam')

    await fillCreate(wrapper)
    await submit(wrapper)

    const posts = api.requests().filter((sent) => sent.method === 'post')
    expect(posts).toHaveLength(1)
    expect(posts[0].body.employee_user.branch).toBe(7)
  })
})

describe('EmployeeUserForm, cancelling', () => {
  test('goes back without sending anything', async () => {
    const wrapper = await mountEmployeeForm()

    await wrapper.get('#employee_username').setValue('emp-jan')
    const cancel = wrapper.findAll('button').find((button) => button.text() === 'Cancel')
    await cancel.trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })
})

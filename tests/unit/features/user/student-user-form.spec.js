import { beforeEach, describe, expect, test, vi } from 'vitest'

import StudentUserForm from '@/features/user/student/StudentUserForm.vue'
import { vStudentUser } from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { userRoutes } from '../../support/user-routes.js'

/**
 * Behaviour characterisation for the student-user form screen
 * (src/views/company/UserStudentForm.vue, normal mode), written BEFORE the
 * user-slice refactor. Everything here pins current behaviour; the converted
 * screen must reproduce it except where the ticket ledger declares
 * otherwise.
 *
 * Seams under test: create vs edit wiring, the wire bodies (create posts the
 * parse output; edit PATCHes with the display-only and empty-password fields
 * stripped), the empty-dob/empty-IBAN shaping, the dob format gate, the
 * validation gates, the username probe, the toasts and the go-back
 * navigation. The register mode (`mode="register"`, the public
 * `/accounts/register/` flow with its own validations) converts in its own
 * follow-up and is not mounted here.
 */

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const RECORD = fixtureFor(vStudentUser, {
  id: 41,
  username: 'student-jan',
  first_name: 'Jan',
  last_name: 'Student',
  full_name: 'Jan Student',
  email: 'student-jan@example.test',
  student_user: {
    street: 'Main street',
    house_number: '1',
    house_number_addition: 'a',
    postal: '1234 AB',
    city: 'Amsterdam',
    country_code: 'NL',
    mobile: '+31612345678',
    iban: 'NL44RABO0123456789',
    gender: 'M',
    dob: '2000-01-15',
    drivers_licence: 'Y',
    drivers_licence_type: 'B',
    box_truck: 'N',
    bsn: '123456789',
    info: 'Third-year apprentice',
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
  api.get('/api/company/studentuser/', { count: 0, next: null, previous: null, results: [] })
  api.get('/api/company/studentuser/{id}/', RECORD)
  api.post('/api/company/studentuser/', RECORD)
  api.patch('/api/company/studentuser/{id}/', RECORD)
})

async function mountStudentForm(props = {}) {
  const wrapper = mountForm(StudentUserForm, {
    deep: true,
    routes: userRoutes,
    props,
  })
  await settle()
  return wrapper
}

async function fillCreate(wrapper) {
  // Type the name first, then let the debounced probe settle before filling
  // the rest: the save waits out the probe, and the suite must hand it a
  // settled verdict rather than an in-flight one.
  await wrapper.get('#studentuser_username').setValue('student-jan')
  await pastDebounce()
  await wrapper.vm.$nextTick()
  await wrapper.get('#studentuser_password1').setValue('secret-password')
  await wrapper.get('#studentuser_password2').setValue('secret-password')
  await wrapper.get('#studentuser_first_name').setValue('Jan')
  await wrapper.get('#studentuser_last_name').setValue('Student')
  await wrapper.get('#studentuser_email').setValue('student-jan@example.test')
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

describe('StudentUserForm, creating a student user', () => {
  test('opens on an empty form', async () => {
    const wrapper = await mountStudentForm()

    expect(wrapper.get('#studentuser_username').element.value).toBe('')
    expect(wrapper.get('#studentuser_first_name').element.value).toBe('')
    expect(wrapper.get('#studentuser_country_code').element.value).toBe('NL')
  })

  test('confirms the creation and goes back', async () => {
    const wrapper = await mountStudentForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Student user has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('the create body carries exactly the write schema’s fields', async () => {
    const wrapper = await mountStudentForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    const posts = api.requests().filter((sent) => sent.method === 'post')
    expect(posts).toHaveLength(1)
    // The legacy model posted password1/password2/id/full_name and the
    // read-only companions; the parse output is the body now, so only schema
    // fields ride.
    expect(Object.keys(posts[0].body).sort()).toEqual(
      ['email', 'first_name', 'last_name', 'password', 'student_user', 'username'],
    )
    expect(posts[0].body.password).toBe('secret-password')
    // Untouched address fields ride blank, the untouched dob as null, the
    // untouched IBAN as absent; the selects ride their defaults.
    expect(posts[0].body.student_user).toEqual({
      street: '',
      house_number: '',
      house_number_addition: '',
      postal: '',
      city: '',
      country_code: 'NL',
      mobile: '',
      dob: null,
      gender: 'M',
      drivers_licence: 'N',
      drivers_licence_type: '',
      box_truck: 'N',
      bsn: '',
      info: '',
    })
  })

  test('a filled date of birth and IBAN ride the create', async () => {
    const wrapper = await mountStudentForm()

    await fillCreate(wrapper)
    await wrapper.get('#studentuser_dob').setValue('2000-01-15')
    await wrapper.get('#studentuser_iban').setValue('NL44RABO0123456789')
    await submit(wrapper)

    const posts = api.requests().filter((sent) => sent.method === 'post')
    expect(posts).toHaveLength(1)
    expect(posts[0].body.student_user.dob).toBe('2000-01-15')
    expect(posts[0].body.student_user.iban).toBe('NL44RABO0123456789')
  })

  test('a mistyped date of birth refuses the submit, and sends nothing', async () => {
    const wrapper = await mountStudentForm()

    await fillCreate(wrapper)
    await wrapper.get('#studentuser_dob').setValue('yesterday')
    await submit(wrapper)

    expect(refused(wrapper, 'Please use yyyy-mm-dd for the date of birth')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('refuses an empty form, and sends nothing', async () => {
    const wrapper = await mountStudentForm()

    await submit(wrapper)

    expect(refused(wrapper, 'Username is required')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('refuses mismatched passwords, and sends nothing', async () => {
    const wrapper = await mountStudentForm()

    await fillCreate(wrapper)
    await wrapper.get('#studentuser_password2').setValue('something-else')
    await submit(wrapper)

    expect(refused(wrapper, 'Passwords do not match')).toBe(true)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('tells the user when the create fails, and stays on the form', async () => {
    api.post('/api/company/studentuser/', serverError)
    const wrapper = await mountStudentForm()

    await fillCreate(wrapper)
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error creating student user')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('StudentUserForm, editing a student user', () => {
  test('opens on the record it was given', async () => {
    const wrapper = await mountStudentForm({ pk: 41 })

    expect(wrapper.get('#studentuser_username').element.value).toBe('student-jan')
    expect(wrapper.get('#studentuser_street').element.value).toBe('Main street')
    expect(wrapper.get('#studentuser_dob').element.value).toBe('2000-01-15')
    expect(wrapper.get('#studentuser_iban').element.value).toBe('NL44RABO0123456789')
    expect(wrapper.get('#studentuser_info').element.value).toBe('Third-year apprentice')
  })

  test('saving patches without the display-only fields', async () => {
    const wrapper = await mountStudentForm({ pk: 41 })

    await wrapper.get('#studentuser_first_name').setValue('Jonathan')
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
    // The student record round-trips on the patch.
    expect(patches[0].body.student_user.street).toBe('Main street')
    expect(patches[0].body.student_user.dob).toBe('2000-01-15')
    expect(toasts().map((toast) => toast.body)).toContain('Student user has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a filled password rides the patch', async () => {
    const wrapper = await mountStudentForm({ pk: 41 })

    await wrapper.get('#studentuser_password1').setValue('new-secret')
    await wrapper.get('#studentuser_password2').setValue('new-secret')
    await submit(wrapper)

    const patches = api.requests().filter((sent) => sent.method === 'patch')
    expect(patches).toHaveLength(1)
    expect(patches[0].body.password).toBe('new-secret')
  })

  test('tells the user when the record cannot be fetched', async () => {
    api.get('/api/company/studentuser/{id}/', serverError)

    await mountStudentForm({ pk: 41 })

    expect(toasts().map((toast) => toast.body)).toContain('Error loading student user')
  })

  test('tells the user when the update fails, and stays on the form', async () => {
    api.patch('/api/company/studentuser/{id}/', serverError)
    const wrapper = await mountStudentForm({ pk: 41 })

    await wrapper.get('#studentuser_first_name').setValue('Jonathan')
    await submit(wrapper)

    expect(toasts().map((toast) => toast.body)).toContain('Error updating student user')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('StudentUserForm, cancelling', () => {
  test('goes back without sending anything', async () => {
    const wrapper = await mountStudentForm()

    await wrapper.get('#studentuser_username').setValue('student-jan')
    const cancel = wrapper.findAll('button').find((button) => button.text() === 'Cancel')
    await cancel.trigger('click')
    await settle()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })
})

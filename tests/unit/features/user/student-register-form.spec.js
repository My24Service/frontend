import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import StudentRegisterForm from '@/features/user/student/StudentRegisterForm.vue'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { userRoutes } from '../../support/user-routes.js'

/**
 * Behaviour characterisation for the public student-registration screen
 * (the `mode="register"` half of the legacy src/views/company/UserStudentForm.vue),
 * written BEFORE its conversion. Everything here pins current behaviour; the
 * converted screen must reproduce it except where noted below.
 *
 * Seams under test: the fields the registrant fills, the validation gates
 * (the required set plus a mobile that normalizes to E.164), the wire body on
 * `/accounts/register/` (no username — the backend derives it — the mobile rides normalized
 * while the input keeps what was typed, no password rides, the date-of-birth
 * and IBAN the form never asks for stay off it), the success copy and the
 * failure toast.
 *
 * One deliberate departure from the legacy screen: it refused `06…` for
 * lacking a country prefix; the converted form normalizes it instead.
 *
 * Deliberately NOT pinned: the legacy body's blind defaults for fields the
 * form never asks about (`gender: 'M'`, `drivers_licence: 'N'`, `box_truck:
 * 'N'`) and its client-only extras (`password1`, `rating`, a numeric
 * `contract_hours_week` the request schema rejects). The converted screen
 * sends the schema's fields for the values it collected and nothing else.
 *
 * The country select is found by class: the legacy screen gives it no id.
 */

enableAutoUnmount(afterEach)

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

const api = installApiSeam()

const REGISTER = '/api/accounts/register/'

// The endpoint answers with the created StudentUser; echo the fields the form
// collects onto a conforming record so whatever the screen sends is a valid
// stub. The legacy body carries extras its own read schema rejects, so this
// picks rather than spreads.
function created({ body }) {
  const sub = body.student_user ?? {}
  return {
    id: 262,
    email: body.email,
    username: body.email,
    first_name: body.first_name,
    last_name: body.last_name,
    full_name: `${body.first_name} ${body.last_name}`,
    student_user: {
      street: sub.street,
      house_number: sub.house_number,
      house_number_addition: sub.house_number_addition,
      postal: sub.postal,
      city: sub.city,
      country_code: sub.country_code,
      mobile: sub.mobile,
      info: sub.info,
      rating_avg: null,
      picture_url: null,
      uuid: 'b1f2c3d4-0000-4000-8000-000000000262',
    },
    user_sick: null,
  }
}

beforeEach(() => {
  toastCreate.mockClear()
  api.post(REGISTER, created)
})

/**
 * The legacy screen waits a full second between the click and the request;
 * poll on real time so the same spec runs against both versions.
 */
async function until(condition, { timeoutMs = 2500 } = {}) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (condition()) return
    await settle()
  }
  throw new Error('condition never became true')
}

function posts() {
  return api.requests().filter((sent) => sent.method === 'post')
}

function mountRegister() {
  return mountForm(StudentRegisterForm, { deep: true, routes: userRoutes })
}

function country(wrapper) {
  return wrapper.get('select.form-select')
}

async function fill(wrapper) {
  await wrapper.get('#studentuser_email').setValue('jan@example.test')
  await wrapper.get('#studentuser_first_name').setValue('Jan')
  await wrapper.get('#studentuser_last_name').setValue('Student')
  await wrapper.get('#studentuser_mobile').setValue('+31612345678')
  await wrapper.get('#studentuser_street').setValue('Main street')
  await wrapper.get('#studentuser_house_number').setValue('1')
  await wrapper.get('#studentuser_house_number_addition').setValue('a')
  await wrapper.get('#studentuser_postal').setValue('1234 AB')
  await wrapper.get('#studentuser_city').setValue('Amsterdam')
  await country(wrapper).setValue('BE')
  await wrapper.get('#studentuser_info').setValue('Third-year apprentice')
}

function registerButton(wrapper) {
  return wrapper.findAll('button').find((button) => button.text() === 'Register')
}

async function submit(wrapper) {
  await registerButton(wrapper).trigger('click')
  await settle()
  await wrapper.vm.$nextTick()
}

function refused(wrapper, text) {
  return wrapper
    .findAll('.invalid-feedback')
    .filter((node) => node.text().includes(text))
    .some((node) => node.classes('d-block'))
}

describe('StudentRegisterForm', () => {
  test('opens on the registration fields, without the staff-only identity fields', async () => {
    const wrapper = mountRegister()
    await settle()

    expect(wrapper.text()).toContain('Register')
    expect(wrapper.get('#studentuser_email').element.value).toBe('')
    expect(country(wrapper).element.value).toBe('NL')
    expect(wrapper.find('#studentuser_username').exists()).toBe(false)
    expect(wrapper.find('#studentuser_password1').exists()).toBe(false)
    expect(wrapper.find('#studentuser_iban').exists()).toBe(false)
    expect(wrapper.find('#studentuser_dob').exists()).toBe(false)
  })

  test('refuses an empty form, and sends nothing', async () => {
    const wrapper = mountRegister()
    await settle()

    await submit(wrapper)
    await settle()

    expect(refused(wrapper, 'Please enter a valid email')).toBe(true)
    expect(refused(wrapper, 'Please enter a first name')).toBe(true)
    expect(refused(wrapper, 'Please enter a last name')).toBe(true)
    expect(refused(wrapper, 'Please enter a mobile')).toBe(true)
    expect(refused(wrapper, 'Please enter a street')).toBe(true)
    expect(refused(wrapper, 'Please enter a house nr./addition')).toBe(true)
    expect(refused(wrapper, 'Please enter a postal')).toBe(true)
    expect(refused(wrapper, 'Please enter a city')).toBe(true)
    expect(refused(wrapper, 'Please tell us something about yourself')).toBe(true)
    expect(posts()).toEqual([])
    expect(registerButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  test('a mobile that is not a number refuses the submit', async () => {
    const wrapper = mountRegister()
    await settle()

    await fill(wrapper)
    await wrapper.get('#studentuser_mobile').setValue('call me')
    await submit(wrapper)
    await settle()

    expect(refused(wrapper, 'Please enter a valid mobile')).toBe(true)
    expect(posts()).toEqual([])
  })

  test.each([
    ['+31 6 12345678'],
    ['06-12345678'],
    ['(0)6 1234 5678'],
  ])('a mobile typed as %s rides the wire normalized, and the input keeps it', async (typed) => {
    const wrapper = mountRegister()
    await settle()

    await fill(wrapper)
    await wrapper.get('#studentuser_mobile').setValue(typed)
    // The input is never rewritten under the user; the normalization is a
    // property of the wire body alone.
    expect(wrapper.get('#studentuser_mobile').element.value).toBe(typed)
    await submit(wrapper)
    await until(() => posts().length > 0)

    expect(posts()[0].body.student_user.mobile).toBe('+31612345678')
  })

  test('a malformed email refuses the submit', async () => {
    const wrapper = mountRegister()
    await settle()

    await fill(wrapper)
    await wrapper.get('#studentuser_email').setValue('not-an-email')
    await submit(wrapper)
    await settle()

    expect(refused(wrapper, 'Please enter a valid email')).toBe(true)
    expect(posts()).toEqual([])
  })

  test('registers without a username or password — the backend derives the one from the email', async () => {
    const wrapper = mountRegister()
    await settle()

    await fill(wrapper)
    await submit(wrapper)
    await until(() => posts().length > 0)

    const sent = posts()
    expect(sent).toHaveLength(1)
    expect(sent[0].path).toBe(REGISTER)
    expect(sent[0].body).toEqual(expect.objectContaining({
      email: 'jan@example.test',
      first_name: 'Jan',
      last_name: 'Student',
    }))
    expect(sent[0].body).not.toHaveProperty('username')
    expect(sent[0].body).not.toHaveProperty('password')
    expect(sent[0].body.student_user).toEqual(expect.objectContaining({
      street: 'Main street',
      house_number: '1',
      house_number_addition: 'a',
      postal: '1234 AB',
      city: 'Amsterdam',
      country_code: 'BE',
      mobile: '+31612345678',
      info: 'Third-year apprentice',
    }))
    expect(sent[0].body.student_user).not.toHaveProperty('dob')
    expect(sent[0].body.student_user).not.toHaveProperty('iban')
  })

  test('a completed registration replaces the form with the activation notice', async () => {
    const wrapper = mountRegister()
    await settle()

    await fill(wrapper)
    await submit(wrapper)
    await until(() => wrapper.text().includes('Registration complete'))

    expect(wrapper.text()).toContain('You will receive an email to activate your account')
    expect(wrapper.find('#studentuser_email').exists()).toBe(false)
    expect(toasts().map((toast) => toast.body)).toContain('Registration success')
  })

  test('a failed registration keeps the form and re-enables the button', async () => {
    api.post(REGISTER, serverError)

    const wrapper = mountRegister()
    await settle()

    await fill(wrapper)
    await submit(wrapper)
    await until(() => toasts().some((toast) => toast.body === 'Error registering'))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#studentuser_email').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Registration complete')
    expect(registerButton(wrapper).attributes('disabled')).toBeUndefined()
  })
})

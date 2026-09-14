import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import StudentUserDetail from '@/features/user/student/StudentUserDetail.vue'
import { vStudentUser } from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { userRoutes } from '../../support/user-routes.js'

/**
 * Behaviour characterisation for the student-user detail screen (legacy
 * src/views/company/UserStudentDetail.vue), written BEFORE its conversion.
 *
 * Seams under test: the detail read for the routed pk, the identity and
 * profile fields the page shows, the picture, the Back link and the failure
 * toast.
 *
 * One test is a regression test rather than a characterisation: the legacy
 * page reads the profile fields (`postal`, `mobile`, `iban`, …) off the top of
 * the record, where the API has never put them — they ride under
 * `student_user`, as the generated `StudentUser` component says — so those
 * rows rendered blank, and "Address" read a field that does not exist at all.
 * The converted page reads the record as the API sends it, and that test
 * fails against the legacy page by design.
 */

enableAutoUnmount(afterEach)

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

const api = installApiSeam()

const DETAIL = '/api/company/studentuser/{id}/'

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
    picture_url: 'https://cdn.example.test/students/41.jpg',
  },
})

beforeEach(() => {
  toastCreate.mockClear()
  api.get(DETAIL, RECORD)
})

async function mountDetail() {
  const wrapper = mountForm(StudentUserDetail, {
    deep: true,
    routes: userRoutes,
    props: { pk: 41 },
  })
  await settle()
  await wrapper.vm.$nextTick()
  return wrapper
}

function currentRouteName(wrapper) {
  return wrapper.vm.$router.currentRoute.value.name
}

describe('StudentUserDetail', () => {
  test('reads the routed student user', async () => {
    await mountDetail()

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/company/studentuser/41/', query: {}, body: undefined },
    ])
  })

  test('shows who the student is', async () => {
    const wrapper = await mountDetail()

    expect(wrapper.text()).toContain('Student user details')
    expect(wrapper.text()).toContain('Jan Student')
    expect(wrapper.text()).toContain('student-jan@example.test')
  })

  test('shows the profile as the API sends it', async () => {
    const wrapper = await mountDetail()

    const text = wrapper.text()
    expect(text).toContain('Main street 1 a')
    expect(text).toContain('1234 AB')
    expect(text).toContain('Amsterdam')
    expect(text).toContain('NL')
    expect(text).toContain('2000-01-15')
    expect(text).toContain('+31612345678')
    expect(text).toContain('NL44RABO0123456789')
    expect(text).toContain('123456789')
    expect(text).toContain('B')
    expect(text).toContain('Third-year apprentice')
    expect(wrapper.get('img.profile-picture').attributes('src')).toBe(
      'https://cdn.example.test/students/41.jpg',
    )
  })

  test('Back returns to the student list', async () => {
    const wrapper = await mountDetail()

    const back = wrapper.findAll('button').find((button) => button.text() === 'Back')
    await back.trigger('click')
    await settle()

    expect(currentRouteName(wrapper)).toBe('users-studentusers')
  })

  test('a failed read tells the user', async () => {
    api.get(DETAIL, serverError)

    await mountDetail()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading studentuser')
  })
})

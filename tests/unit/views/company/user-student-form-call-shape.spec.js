import { beforeEach, describe, expect, test, vi } from 'vitest'

import UserStudentForm from '@/views/company/UserStudentForm.vue'

import { mountForm, resetFakeHttp, toastCreate } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Call-shape characterisation for UserStudentForm's migrated register call
 * site.
 *
 * Pre-refactor (192a67d9) the register branch of submitForm() called
 * studentUserModel.register() (src/models/company/UserStudent.js), which did
 * `axios.post('/accounts/register/', studentUser, headers)`. The refactor
 * replaced it with the generated accountsRegisterCreate op
 * (POST /api/accounts/register/). The view performs the same body mutations in
 * both versions before the call (drop student_user.dob/iban and password,
 * username := email), so the payload is identical; the CSRF handshake the old
 * model issued first is not part of any recorded shape.
 */

const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/services/api', () => ({ default: fakeHttp, normalClient: fakeHttp }))

vi.mock('@/api/client.gen', async () => {
  const { apiClientMock } = await import('../../support/api-client-mock.js')
  return apiClientMock(fakeHttp)
})

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

/** Drain microtasks so the register promise settles. */
async function flush() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

beforeEach(() => {
  resetFakeHttp(fakeHttp)
  fakeHttp.post.mockResolvedValue({ data: {} })
  toastCreate.mockClear()
})

describe('UserStudentForm - register', () => {
  test('posts the stripped student payload to the register endpoint', async () => {
    const wrapper = mountForm(UserStudentForm, { props: { mode: 'register' } })

    wrapper.vm.studentuser = {
      username: 'old-name',
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@example.test',
      password1: 'pw1',
      password2: 'pw2',
      password: 'pw1',
      student_user: {
        street: 'Main 1',
        dob: '2000-01-01',
        iban: 'NL91ABNA0417164300',
      },
    }

    await wrapper.vm.submitForm()
    await flush()

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      {
        method: 'post',
        path: '/api/accounts/register/',
        query: {},
        body: {
          username: 'ada@example.test',
          first_name: 'Ada',
          last_name: 'Lovelace',
          email: 'ada@example.test',
          password1: 'pw1',
          password2: 'pw2',
          student_user: { street: 'Main 1' },
        },
      },
    ])
  })

  test('keeps the student_user fields the register form is allowed to send', async () => {
    const wrapper = mountForm(UserStudentForm, { props: { mode: 'register' } })

    wrapper.vm.studentuser = {
      username: 'old-name',
      email: 'u@example.test',
      student_user: { city: 'Amsterdam', iban: '', dob: '' },
    }

    await wrapper.vm.submitForm()
    await flush()

    expect(requestShapes(fakeHttp, { method: 'post' })[0].body).toEqual({
      username: 'u@example.test',
      email: 'u@example.test',
      student_user: { city: 'Amsterdam' },
    })
  })
})

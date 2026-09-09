import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import UserStudentRegisterVerify from '@/views/company/UserStudentRegisterVerify.vue'
import UserStudentRegisterResetPassword from '@/views/company/UserStudentRegisterResetPassword.vue'
import { SetPasswordForm } from '@/features/account'

import { mountListView, resetFakeHttp, toastCreate, toasts } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Behaviour characterisation for the registration coupling.
 *
 * Seams under test: the verify-on-created flow
 * (src/views/company/UserStudentRegisterVerify.vue) and the reset wrapper
 * (src/views/company/UserStudentRegisterResetPassword.vue). Both ride the
 * generated account mutations, which is why they are pinned with the account
 * slice even though they live under the company router. Link params come from
 * the route query. The student-registration screens themselves belong to a
 * later slice.
 */

enableAutoUnmount(afterEach)

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

/** Drain macrotasks so the mutation promise chain settles. */
async function flush() {
  for (let i = 0; i < 10; i++) await new Promise((resolve) => setTimeout(resolve, 0))
}

async function until(condition, { attempts = 200 } = {}) {
  for (let i = 0; i < attempts; i++) {
    if (condition()) return
    await flush()
  }
  throw new Error('condition never became true')
}

const QUERY = { user_id: '9', timestamp: '1700000001', signature: 'sig-def' }
const PARAMS = { user_id: '9', timestamp: 1700000001, signature: 'sig-def' }

beforeEach(() => {
  resetFakeHttp(fakeHttp)
  toastCreate.mockClear()
})

describe('UserStudentRegisterVerify', () => {
  test('it verifies the link params on created', async () => {
    await mountListView(UserStudentRegisterVerify, { deep: true, query: QUERY })
    await until(() => requestShapes(fakeHttp, { method: 'post' }).length > 0)

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      {
        method: 'post',
        path: '/api/accounts/verify-registration/',
        query: {},
        body: PARAMS,
      },
    ])
  })

  test('a verified account offers the password-reset link', async () => {
    const wrapper = await mountListView(UserStudentRegisterVerify, { deep: true, query: QUERY })
    await until(() => wrapper.text().includes('Verify success'))

    expect(wrapper.text()).toContain('Verify success')
    expect(toasts().map((toast) => toast.body)).toContain('Account has been verified')
  })

  test('sending the link posts user_id as a registration', async () => {
    const wrapper = await mountListView(UserStudentRegisterVerify, { deep: true, query: QUERY })
    await until(() => wrapper.text().includes('Verify success'))

    await wrapper.get('.btn-primary').trigger('click')
    await until(() => requestShapes(fakeHttp, { method: 'post' }).length > 1)

    const posts = requestShapes(fakeHttp, { method: 'post' })
    expect(posts).toHaveLength(2)
    expect(posts[1]).toEqual({
      method: 'post',
      path: '/api/accounts/send-reset-password-link/',
      query: {},
      body: { user_id: 9, isRegistration: true },
    })
    expect(wrapper.text()).toContain('Email sent')
    expect(toasts().map((toast) => toast.body)).toContain('Password reset link sent')
  })

  test('a failed verify shows the error state', async () => {
    fakeHttp.post.mockRejectedValueOnce(new Error('boom'))

    const wrapper = await mountListView(UserStudentRegisterVerify, { deep: true, query: QUERY })
    await until(() => wrapper.text().includes('Error verifying'))

    expect(wrapper.text()).toContain('Error verifying')
    expect(toasts().map((toast) => toast.body)).toContain('Error verifying')
  })

  test('a failed resend tells the user', async () => {
    const wrapper = await mountListView(UserStudentRegisterVerify, { deep: true, query: QUERY })
    await until(() => wrapper.text().includes('Verify success'))
    fakeHttp.post.mockRejectedValueOnce(new Error('boom'))

    await wrapper.get('.btn-primary').trigger('click')
    await until(() => toasts().some((toast) => toast.body === 'Error sending password reset link'))

    expect(wrapper.text()).toContain('Error sending email')
  })

  test('a link without usable params sends nothing and shows the error state', async () => {
    const wrapper = await mountListView(UserStudentRegisterVerify, { deep: true, query: {} })
    await until(() => wrapper.text().includes('Error verifying'))

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([])
    expect(toasts().map((toast) => toast.body)).toContain('Error verifying')
  })
})

describe('UserStudentRegisterResetPassword', () => {
  test('it renders the shared password form', async () => {
    const wrapper = await mountListView(UserStudentRegisterResetPassword, { deep: true, query: QUERY })
    await flush()

    expect(wrapper.findComponent(SetPasswordForm).exists()).toBe(true)
  })
})

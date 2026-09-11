import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import UserStudentRegisterVerify from '@/views/company/UserStudentRegisterVerify.vue'
import UserStudentRegisterResetPassword from '@/views/company/UserStudentRegisterResetPassword.vue'
import { SetPasswordForm } from '@/features/account'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

/**
 * Behaviour characterisation for the registration coupling.
 *
 * Seams under test: the verify-on-created flow
 * (src/views/company/UserStudentRegisterVerify.vue) and the reset wrapper
 * (src/views/company/UserStudentRegisterResetPassword.vue). The seam sits
 * below both HTTP clients, so these specs record the request that would go on
 * the wire and reject a body the endpoint's request schema rejects. Both ride
 * the generated account mutations, which is why they are pinned with the
 * account slice even though they live under the company router. Link params
 * come from the route query. The student-registration screens themselves
 * belong to a later slice.
 */

enableAutoUnmount(afterEach)

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

const api = installApiSeam()

const VERIFY = '/api/accounts/verify-registration/'
const SEND_LINK = '/api/accounts/send-reset-password-link/'
const RESET = '/api/accounts/reset-password/'

const QUERY = { user_id: '9', timestamp: '1700000001', signature: 'sig-def' }
const PARAMS = { user_id: '9', timestamp: 1700000001, signature: 'sig-def' }

beforeEach(() => {
  toastCreate.mockClear()
  // The verify and reset responses echo the request: each carries the link
  // params (plus the password on reset), so whatever the screen sends is a
  // valid stub.
  api.post(VERIFY, ({ body }) => body)
  api.post(SEND_LINK, {})
  api.post(RESET, ({ body }) => body)
})

async function until(condition, { attempts = 200 } = {}) {
  for (let i = 0; i < attempts; i++) {
    if (condition()) return
    await settle()
  }
  throw new Error('condition never became true')
}

function posts() {
  return api.requests().filter((sent) => sent.method === 'post')
}

describe('UserStudentRegisterVerify', () => {
  test('it verifies the link params on created', async () => {
    await mountListView(UserStudentRegisterVerify, { deep: true, query: QUERY })
    await until(() => posts().length > 0)

    expect(posts()).toEqual([
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
    await until(() => posts().length > 1)

    const sent = posts()
    expect(sent).toHaveLength(2)
    expect(sent[1]).toEqual({
      method: 'post',
      path: '/api/accounts/send-reset-password-link/',
      query: {},
      body: { user_id: 9, isRegistration: true },
    })
    expect(wrapper.text()).toContain('Email sent')
    expect(toasts().map((toast) => toast.body)).toContain('Password reset link sent')
  })

  test('a failed verify shows the error state', async () => {
    api.post(VERIFY, serverError)

    const wrapper = await mountListView(UserStudentRegisterVerify, { deep: true, query: QUERY })
    await until(() => wrapper.text().includes('Error verifying'))

    expect(wrapper.text()).toContain('Error verifying')
    expect(toasts().map((toast) => toast.body)).toContain('Error verifying')
  })

  test('a failed resend tells the user', async () => {
    const wrapper = await mountListView(UserStudentRegisterVerify, { deep: true, query: QUERY })
    await until(() => wrapper.text().includes('Verify success'))
    api.post(SEND_LINK, serverError)

    await wrapper.get('.btn-primary').trigger('click')
    await until(() => toasts().some((toast) => toast.body === 'Error sending password reset link'))

    expect(wrapper.text()).toContain('Error sending email')
  })

  test('a link without usable params sends nothing and shows the error state', async () => {
    const wrapper = await mountListView(UserStudentRegisterVerify, { deep: true, query: {} })
    await until(() => wrapper.text().includes('Error verifying'))

    expect(posts()).toEqual([])
    expect(toasts().map((toast) => toast.body)).toContain('Error verifying')
  })
})

describe('UserStudentRegisterResetPassword', () => {
  test('it renders the shared password form', async () => {
    const wrapper = await mountListView(UserStudentRegisterResetPassword, { deep: true, query: QUERY })
    await settle()

    expect(wrapper.findComponent(SetPasswordForm).exists()).toBe(true)
  })
})

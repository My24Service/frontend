import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import StudentRegisterVerify from '@/features/user/student/StudentRegisterVerify.vue'
import { ResetPasswordConfirmView } from '@/features/account'
import companyRoutes from '@/router/company.js'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

/**
 * Behaviour characterisation for the student registration's activation step
 * (src/features/user/student/StudentRegisterVerify.vue), written against the
 * legacy src/views/company/UserStudentRegisterVerify.vue and run unchanged
 * against its conversion.
 *
 * Seams under test: the verify-on-arrival flow, the send-link step it offers,
 * and the wire bodies of both. The seam sits below both HTTP clients, so
 * these specs record the request that would go on the wire and reject a body
 * the endpoint's request schema rejects. Link params come from the route
 * query.
 *
 * The set-password step that follows the mailed link is the account slice's
 * own screen; the legacy wrapper around it is gone, and the route pin at the
 * bottom is what keeps the mailed URL working.
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
const PARAMS = { user_id: 9, timestamp: 1700000001, signature: 'sig-def' }

beforeEach(() => {
  toastCreate.mockClear()
  // The verify response echoes the link params — except that the backend's
  // response component still declares `user_id` as a string where the
  // request now takes an integer (nothing on the frontend reads the
  // response, so it is stubbed to conform rather than worked around).
  api.post(VERIFY, ({ body }) => ({ ...body, user_id: String(body.user_id) }))
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

describe('StudentRegisterVerify', () => {
  test('it verifies the link params on created', async () => {
    await mountListView(StudentRegisterVerify, { deep: true, query: QUERY })
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
    const wrapper = await mountListView(StudentRegisterVerify, { deep: true, query: QUERY })
    await until(() => wrapper.text().includes('Verify success'))

    expect(wrapper.text()).toContain('Verify success')
    expect(toasts().map((toast) => toast.body)).toContain('Account has been verified')
  })

  test('sending the link posts user_id as a registration', async () => {
    const wrapper = await mountListView(StudentRegisterVerify, { deep: true, query: QUERY })
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

    const wrapper = await mountListView(StudentRegisterVerify, { deep: true, query: QUERY })
    await until(() => wrapper.text().includes('Error verifying'))

    expect(wrapper.text()).toContain('Error verifying')
    expect(toasts().map((toast) => toast.body)).toContain('Error verifying')
  })

  test('a failed resend tells the user', async () => {
    const wrapper = await mountListView(StudentRegisterVerify, { deep: true, query: QUERY })
    await until(() => wrapper.text().includes('Verify success'))
    api.post(SEND_LINK, serverError)

    await wrapper.get('.btn-primary').trigger('click')
    await until(() => toasts().some((toast) => toast.body === 'Error sending password reset link'))

    expect(wrapper.text()).toContain('Error sending email')
  })

  test('a link without usable params sends nothing and shows the error state', async () => {
    const wrapper = await mountListView(StudentRegisterVerify, { deep: true, query: {} })
    await until(() => wrapper.text().includes('Error verifying'))

    expect(posts()).toEqual([])
    expect(toasts().map((toast) => toast.body)).toContain('Error verifying')
  })
})

describe('the registration set-password route', () => {
  test('mounts the account slice’s reset screen at the mailed URL, without auth', () => {
    const [root] = companyRoutes
    const route = root.children.find((child) => child.name === 'studentuser-reset-password')

    expect(route.path).toBe('/company/student-users/register/reset-password')
    expect(route.meta).toMatchObject({ needsAuth: false })
    expect(route.components['app-content']).toBe(ResetPasswordConfirmView)
  })
})

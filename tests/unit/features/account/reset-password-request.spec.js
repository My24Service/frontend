import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import { SendResetLinkView } from '@/features/account'

import {
  mountForm,
  resetFakeHttp,
  routerGo,
  toastCreate,
  toasts,
} from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Behaviour characterisation for the reset-link request screen
 * (src/features/account/SendResetLinkView.vue).
 *
 * Seams under test: the rendered form, the validation gate, the wire body,
 * the toasts and the back navigation. The fake sits below both HTTP clients,
 * so these specs record the request that would go on the wire. Copy stays
 * identical, including the go-back on success.
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

beforeEach(() => {
  resetFakeHttp(fakeHttp)
  toastCreate.mockClear()
})

async function mountView() {
  const wrapper = mountForm(SendResetLinkView, { deep: true })
  await flush()
  return wrapper
}

describe('ResetPassword request view', () => {
  test('it asks for the account email', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Reset password')
    expect(wrapper.get('#email').exists()).toBe(true)
  })

  test('an empty submit sends nothing', async () => {
    const wrapper = await mountView()

    await wrapper.get('.btn-primary').trigger('click')
    await flush()

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([])
  })

  test('a filled submit posts the email and goes back', async () => {
    const wrapper = await mountView()

    await wrapper.get('#email').setValue('user@example.test')
    await wrapper.get('.btn-primary').trigger('click')
    await until(() => requestShapes(fakeHttp, { method: 'post' }).length > 0)
    await until(() => toasts().length > 0)

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      {
        method: 'post',
        path: '/api/accounts/send-reset-password-link/',
        query: {},
        body: { email: 'user@example.test', isRegistration: false },
      },
    ])
    expect(toasts().map((toast) => toast.body)).toContain('Password reset link has been sent')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a failed submit tells the user and stays put', async () => {
    fakeHttp.post.mockRejectedValueOnce(new Error('boom'))
    const wrapper = await mountView()

    await wrapper.get('#email').setValue('user@example.test')
    await wrapper.get('.btn-primary').trigger('click')
    await until(() => toasts().length > 0)

    expect(toasts()).not.toEqual([])
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

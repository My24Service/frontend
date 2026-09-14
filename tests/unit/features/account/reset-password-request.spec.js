import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import { SendResetLinkView } from '@/features/account'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

/**
 * Behaviour characterisation for the reset-link request screen
 * (src/features/account/SendResetLinkView.vue).
 *
 * Seams under test: the rendered form, the validation gate, the wire body,
 * the toasts and the back navigation. The seam sits below both HTTP clients,
 * so these specs record the request that would go on the wire and reject a
 * body the endpoint's request schema rejects. Copy stays identical, including
 * the go-back on success.
 */

enableAutoUnmount(afterEach)

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

const api = installApiSeam()

const SEND_LINK = '/api/accounts/send-reset-password-link/'

beforeEach(() => {
  toastCreate.mockClear()
  api.post(SEND_LINK, {})
})

async function mountView() {
  const wrapper = mountForm(SendResetLinkView, { deep: true })
  await settle()
  return wrapper
}

async function until(condition, { attempts = 200 } = {}) {
  for (let i = 0; i < attempts; i++) {
    if (condition()) return
    await settle()
  }
  throw new Error('condition never became true')
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
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('an empty submit shows what the box is missing', async () => {
    // The copy rides the shared ValidatedFormField now: a misspelt error prop
    // would keep the "sends nothing" tests green and leave the user with no
    // reason for the refusal.
    const wrapper = await mountView()

    await wrapper.get('.btn-primary').trigger('click')
    await settle()

    expect(wrapper.get('.invalid-feedback.d-block').text()).toBe('Please enter an email')
  })

  test('a filled submit posts the email and goes back', async () => {
    const wrapper = await mountView()

    await wrapper.get('#email').setValue('user@example.test')
    await wrapper.get('.btn-primary').trigger('click')
    await until(() => api.requests().filter((sent) => sent.method === 'post').length > 0)
    await until(() => toasts().length > 0)

    expect(api.requests()).toEqual([
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

  test('a second click while the request is pending sends nothing extra', async () => {
    // The pending guard is what keeps a double click from posting the link
    // twice. Hold the first request open so the mutation is still pending
    // when the second click lands.
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    api.post(SEND_LINK, () => gate)
    const wrapper = await mountView()

    await wrapper.get('#email').setValue('user@example.test')
    await wrapper.get('.btn-primary').trigger('click')
    await wrapper.get('.btn-primary').trigger('click')
    release({})
    await until(() => toasts().length > 0)

    expect(api.requests().filter((sent) => sent.method === 'post')).toHaveLength(1)
  })

  test('a failed submit tells the user and stays put', async () => {
    api.post(SEND_LINK, serverError)
    const wrapper = await mountView()

    await wrapper.get('#email').setValue('user@example.test')
    await wrapper.get('.btn-primary').trigger('click')
    await until(() => toasts().length > 0)

    expect(toasts()).not.toEqual([])
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

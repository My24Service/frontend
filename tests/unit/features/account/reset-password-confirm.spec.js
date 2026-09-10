import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import { ResetPasswordConfirmView, SetPasswordForm } from '@/features/account'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, mountListView, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

/**
 * Behaviour characterisation for the password-set form
 * (src/features/account/SetPasswordForm.vue) and its thin account
 * wrapper (src/features/account/ResetPasswordConfirmView.vue).
 *
 * Seams under test: the rendered fields, the match validation, the wire body
 * (route query params plus the new password), the toasts and the push home on
 * success. The seam sits below both HTTP clients, so these specs record the
 * request that would go on the wire and reject a body the endpoint's request
 * schema rejects. The same form is also mounted by the student-registration
 * screen, so its contract here is shared. Link params come from the route
 * query. A link without usable params fails fast with the error toast and
 * sends nothing.
 */

enableAutoUnmount(afterEach)

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

const api = installApiSeam()

const RESET = '/api/accounts/reset-password/'

beforeEach(() => {
  toastCreate.mockClear()
  // The response echoes the request body: both carry user_id, timestamp,
  // signature and password, so whatever the form sends is a valid stub.
  api.post(RESET, ({ body }) => body)
})

async function mountFormComponent(query = LINK) {
  const wrapper = await mountListView(SetPasswordForm, { deep: true, query })
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

const LINK = { user_id: '7', timestamp: '1700000000', signature: 'sig-abc' }

describe('ResetPasswordConfirm view', () => {
  test('it renders the shared password form', async () => {
    const wrapper = await mountListView(ResetPasswordConfirmView, { deep: true, query: LINK })
    await settle()

    expect(wrapper.findComponent(SetPasswordForm).exists()).toBe(true)
  })
})

describe('ResetPassword form', () => {
  test('it asks for the password twice', async () => {
    const wrapper = await mountFormComponent()

    expect(wrapper.get('#password1').exists()).toBe(true)
    expect(wrapper.get('#password2').exists()).toBe(true)
  })

  test('an empty submit sends nothing', async () => {
    const wrapper = await mountFormComponent()

    await wrapper.get('.btn-primary').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('mismatched passwords send nothing', async () => {
    const wrapper = await mountFormComponent()

    await wrapper.get('#password1').setValue('new-secret')
    await wrapper.get('#password2').setValue('something-else')
    await wrapper.get('.btn-primary').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
  })

  test('matching passwords post the link params plus the password and go home', async () => {
    const wrapper = await mountFormComponent()
    const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue()

    await wrapper.get('#password1').setValue('new-secret')
    await wrapper.get('#password2').setValue('new-secret')
    await wrapper.get('.btn-primary').trigger('click')
    await until(() => api.requests().filter((sent) => sent.method === 'post').length > 0)
    await until(() => toasts().length > 0)

    expect(api.requests()).toEqual([
      {
        method: 'post',
        path: '/api/accounts/reset-password/',
        query: {},
        body: { user_id: '7', timestamp: 1700000000, signature: 'sig-abc', password: 'new-secret' },
      },
    ])
    expect(toasts().map((toast) => toast.body)).toContain('Reset password successful')
    expect(push).toHaveBeenCalledWith({ path: '/' })
  })

  test('a link without usable params sends nothing and tells the user', async () => {
    const wrapper = await mountFormComponent({})
    const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue()

    await wrapper.get('#password1').setValue('new-secret')
    await wrapper.get('#password2').setValue('new-secret')
    await wrapper.get('.btn-primary').trigger('click')
    await until(() => toasts().length > 0)

    expect(api.requests().filter((sent) => sent.method === 'post')).toEqual([])
    expect(push).not.toHaveBeenCalled()
    expect(toasts().map((toast) => toast.body)).toContain(
      'Something went wrong, please try again',
    )
  })

  test('a second click while the request is pending sends nothing extra', async () => {
    // The pending guard is what keeps a double click from posting two
    // resets. Hold the first request open so the mutation is still pending
    // when the second click lands.
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    api.post(RESET, ({ body }) => gate.then(() => body))
    const wrapper = await mountFormComponent()

    await wrapper.get('#password1').setValue('new-secret')
    await wrapper.get('#password2').setValue('new-secret')
    await wrapper.get('.btn-primary').trigger('click')
    await wrapper.get('.btn-primary').trigger('click')
    release({})
    await until(() => toasts().length > 0)

    expect(api.requests().filter((sent) => sent.method === 'post')).toHaveLength(1)
  })

  test('a failed submit tells the user and stays put', async () => {
    api.post(RESET, serverError)
    const wrapper = await mountFormComponent()
    const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue()

    await wrapper.get('#password1').setValue('new-secret')
    await wrapper.get('#password2').setValue('new-secret')
    await wrapper.get('.btn-primary').trigger('click')
    await until(() => toasts().length > 0)

    expect(toasts()).not.toEqual([])
    expect(push).not.toHaveBeenCalled()
  })
})

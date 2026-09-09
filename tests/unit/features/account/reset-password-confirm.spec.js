import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import { ResetPasswordConfirmView, SetPasswordForm } from '@/features/account'

import {
  mountForm,
  mountListView,
  resetFakeHttp,
  toastCreate,
  toasts,
} from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Behaviour characterisation for the password-set form
 * (src/features/account/SetPasswordForm.vue) and its thin account
 * wrapper (src/features/account/ResetPasswordConfirmView.vue).
 *
 * Seams under test: the rendered fields, the match validation, the wire body
 * (route query params plus the new password), the toasts and the push home on
 * success. The same form is also mounted by the student-registration screen,
 * so its contract here is shared. Link params come from the route query. A
 * link without usable params fails fast with the error toast and sends
 * nothing.
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

const LINK = { user_id: '7', timestamp: '1700000000', signature: 'sig-abc' }

beforeEach(() => {
  resetFakeHttp(fakeHttp)
  toastCreate.mockClear()
})

async function mountFormComponent(query = LINK) {
  const wrapper = await mountListView(SetPasswordForm, { deep: true, query })
  await flush()
  return wrapper
}

describe('ResetPasswordConfirm view', () => {
  test('it renders the shared password form', async () => {
    const wrapper = await mountListView(ResetPasswordConfirmView, { deep: true, query: LINK })
    await flush()

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
    await flush()

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([])
  })

  test('mismatched passwords send nothing', async () => {
    const wrapper = await mountFormComponent()

    await wrapper.get('#password1').setValue('new-secret')
    await wrapper.get('#password2').setValue('something-else')
    await wrapper.get('.btn-primary').trigger('click')
    await flush()

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([])
  })

  test('matching passwords post the link params plus the password and go home', async () => {
    const wrapper = await mountFormComponent()
    const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue()

    await wrapper.get('#password1').setValue('new-secret')
    await wrapper.get('#password2').setValue('new-secret')
    await wrapper.get('.btn-primary').trigger('click')
    await until(() => requestShapes(fakeHttp, { method: 'post' }).length > 0)
    await until(() => toasts().length > 0)

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
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

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([])
    expect(push).not.toHaveBeenCalled()
  })

  test('a failed submit tells the user and stays put', async () => {
    fakeHttp.post.mockRejectedValueOnce(new Error('boom'))
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

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import TheNavLoggedIn from '@/components/TheNavLoggedIn.vue'

import {
  mountForm,
  resetFakeHttp,
  toastCreate,
  toasts,
} from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Behaviour characterisation for the change-password dialog
 * (src/components/TheNavLoggedIn.vue, password-change-modal).
 *
 * Seams under test: the validation gate, the wire body, the toasts and the
 * modal hide. This dialog stays in app chrome: it is the logged-in password
 * change on POST /api/change-password/ with body {old_password,
 * new_password1}, a different endpoint and shape from the anonymous reset
 * link flow the account slice owns. The confirm field never rides the wire.
 * Hide runs on success only.
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

/** Drain macrotasks so the SDK promise chain settles. */
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

const MAIN = {
  checkInitialData: async () => {},
  memberInfo: null,
}

function stubModalHide(wrapper) {
  // The component hides through this.$refs['password-change-modal'].hide().
  // $refs is read-only on the instance, so define the entry on it directly.
  const hide = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(wrapper.vm.$refs, 'password-change-modal', {
    value: { hide },
    configurable: true,
  })
  return hide
}

function posts() {
  return requestShapes(fakeHttp, { method: 'post' })
}

beforeEach(() => {
  resetFakeHttp(fakeHttp)
  toastCreate.mockClear()
})

async function mountNav() {
  const wrapper = mountForm(TheNavLoggedIn, {
    deep: true,
    main: MAIN,
    stubs: {
      Notification: { template: '<div />' },
      TokenRefresh: { template: '<div />' },
      NavDefault: { template: '<div />' },
      NavShltr: { template: '<div />' },
    },
  })
  await flush()
  return wrapper
}

async function fillAndSubmit(wrapper, { oldPassword, newPassword1, newPassword2 }) {
  wrapper.vm.old_password = oldPassword
  wrapper.vm.new_password1 = newPassword1
  wrapper.vm.new_password2 = newPassword2
  // Vuelidate reads the field values through a computed. It still sees the
  // previous tick without this, so a matching pair would fail sameAs.
  await wrapper.vm.$nextTick()
  await wrapper.vm.doPasswordChange()
  await flush()
}

describe('TheNavLoggedIn change-password dialog', () => {
  test('an empty submit sends nothing', async () => {
    const wrapper = await mountNav()

    await wrapper.vm.doPasswordChange()
    await flush()

    expect(posts()).toEqual([])
  })

  test('mismatched passwords send nothing', async () => {
    const wrapper = await mountNav()

    await fillAndSubmit(wrapper, {
      oldPassword: 'old-secret',
      newPassword1: 'new-secret',
      newPassword2: 'something-else',
    })

    expect(posts()).toEqual([])
  })

  test('matching passwords post old and new passwords and hide the modal', async () => {
    const wrapper = await mountNav()
    const hide = stubModalHide(wrapper)

    await fillAndSubmit(wrapper, {
      oldPassword: 'old-secret',
      newPassword1: 'new-secret',
      newPassword2: 'new-secret',
    })
    await until(() => toasts().length > 0)

    expect(posts()).toEqual([
      {
        method: 'post',
        path: '/api/change-password/',
        query: {},
        body: { old_password: 'old-secret', new_password1: 'new-secret' },
      },
    ])
    expect(toasts().map((toast) => toast.body)).toContain('Your password is changed')
    expect(hide).toHaveBeenCalled()
  })

  test('a failed submit tells the user and leaves the modal open', async () => {
    fakeHttp.post.mockRejectedValueOnce(new Error('boom'))
    const wrapper = await mountNav()
    const hide = stubModalHide(wrapper)

    await fillAndSubmit(wrapper, {
      oldPassword: 'old-secret',
      newPassword1: 'new-secret',
      newPassword2: 'new-secret',
    })
    await until(() => toasts().length > 0)

    expect(toasts().map((toast) => toast.body)).toContain('Error changing your password')
    expect(hide).not.toHaveBeenCalled()
  })
})

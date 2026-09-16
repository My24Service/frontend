import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import TheNavLoggedIn from '@/components/TheNavLoggedIn.vue'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toastCreate, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

/**
 * Behaviour characterisation for the change-password dialog
 * (src/components/TheNavLoggedIn.vue, password-change-modal).
 *
 * Seams under test: the validation gate, the wire body, the toasts and the
 * modal hide. The seam sits below both HTTP clients, so this spec records the
 * request that would go on the wire and rejects a body the endpoint's request
 * schema rejects. This dialog stays in app chrome: it is the logged-in
 * password change on POST /api/change-password/ with body {old_password,
 * new_password1}, a different endpoint and shape from the anonymous reset
 * link flow the account slice owns. The confirm field never rides the wire.
 * Hide runs on success only.
 */

enableAutoUnmount(afterEach)

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

const api = installApiSeam()

const CHANGE = '/api/change-password/'

beforeEach(() => {
  toastCreate.mockClear()
  // The endpoint answers with no body; the seam's void contract is an
  // explicit empty 204.
  api.post(CHANGE, ({ body }) => ({ old_password: body.old_password, password: body.new_password1 }))
  // The nav's created() opens the member-data socket, which GETs its room
  // over the legacy client. Without a stub the mount dies on a 501.
  api.get('/api/get-member-new-data-room/', { room: 'test-room' })
})

async function until(condition, { attempts = 200 } = {}) {
  for (let i = 0; i < attempts; i++) {
    if (condition()) return
    await settle()
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
  return api.requests().filter((sent) => sent.method === 'post')
}

async function mountNav() {
  const wrapper = mountForm(TheNavLoggedIn, {
    deep: true,
    main: MAIN,
    stubs: {
      Notification: { template: '<div />' },
      TokenRefresh: { template: '<div />' },
      TheNav: { template: '<div />' },
    },
  })
  await settle()
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
  await settle()
}

describe('TheNavLoggedIn change-password dialog', () => {
  test('an empty submit sends nothing', async () => {
    const wrapper = await mountNav()

    await wrapper.vm.doPasswordChange()
    await settle()

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
    api.post(CHANGE, serverError)
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

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  enableAutoUnmount,
  mount,
} from '@vue/test-utils'

import { createTestingPinia } from '@pinia/testing'
import { createMemoryHistory, createRouter } from 'vue-router'

import TheIndex from '@/components/TheIndex.vue'
import componentMixin from '@/mixins/common'
import { useAuthStore } from '@/features/auth'
import { useMainStore } from '@/stores/main'

/**
 * Behaviour characterisation for the post-login redirect
 * (src/components/TheIndex.vue).
 *
 * Seams under test: the redirect waits for both halves of isLoggedIn (token
 * plus bootstrap userInfo), honors ?next= when present, and otherwise picks
 * dashboard or order-list by member branches. The component stays in app
 * chrome: the redirect composes session and member state, so it is not slice
 * logic. These specs pin the ordering it must keep.
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

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

/** Drain macrotasks so the watcher settles. */
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

const MAIN_READY = {
  checkInitialData: vi.fn().mockResolvedValue({}),
  isInitialDataFetched: true,
  memberInfo: { name: 'Acme' },
  getMemberHasBranches: true,
}

beforeEach(() => {
  MAIN_READY.checkInitialData.mockClear()
})

async function mountIndex({ isLoggedIn = false, branches = true, location } = {}) {
  // Mounted by hand, not through the form harness: the redirect fires in
  // setup, so the router spies must exist before mounting, and the location
  // stub must exist before setup reads it.
  if (location !== undefined) {
    vi.spyOn(window, 'location', 'get').mockReturnValue(location)
  }
  const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: true })
  const mainStore = useMainStore(pinia)
  mainStore.checkInitialData = vi.fn().mockResolvedValue({})
  mainStore.isInitialDataFetched = true
  mainStore.memberInfo = { name: 'Acme' }
  mainStore.getMemberHasBranches = branches
  Object.assign(useAuthStore(pinia), { isLoggedIn })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'home', component: { template: '<div />' } }],
  })
  const push = vi.spyOn(router, 'push').mockResolvedValue()
  const replace = vi.spyOn(router, 'replace').mockResolvedValue()

  const wrapper = mount(TheIndex, {
    global: {
      plugins: [pinia, router],
      mixins: [componentMixin],
      stubs: {
        LoginForm: { template: '<div />' },
        NavBrand: { template: '<div />' },
        Version: { template: '<div />' },
      },
    },
  })
  await flush()
  return { wrapper, push, replace }
}

describe('TheIndex redirect', () => {
  test('it waits for the bootstrap: logged out redirects nowhere', async () => {
    const { push, replace } = await mountIndex({ isLoggedIn: false })

    expect(push).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
  })

  test('it honors ?next= when both halves are ready', async () => {
    // The component reads ?next= from window.location, not the route. The
    // mock keeps the real URL shape so new URL(location) still parses.
    const location = new URL('https://app.test/?next=/customers/customers')
    const { push } = await mountIndex({ isLoggedIn: true, location })

    expect(push).toHaveBeenCalledWith({ path: '/customers/customers' })
  })

  test('without ?next= it picks dashboard for members with branches', async () => {
    const { replace } = await mountIndex({ isLoggedIn: true, branches: true })

    expect(replace).toHaveBeenCalledWith({ name: 'dashboard' })
  })

  test('without ?next= it picks order-list for members without branches', async () => {
    const { replace } = await mountIndex({ isLoggedIn: true, branches: false })

    expect(replace).toHaveBeenCalledWith({ name: 'order-list' })
  })
})

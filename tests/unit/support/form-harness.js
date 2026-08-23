import { vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createMemoryHistory, createRouter } from 'vue-router'

import componentMixin from '@/mixins/common'
import { useMainStore } from '@/stores/main'

// Shared harness for the form-view specs. The traps it exists to encode are
// documented at each call site below - read them before writing a new form spec,
// because most of them produce a *passing* test that measures nothing rather
// than a visible failure.

/**
 * The spy behind useToast().create.
 *
 * The bootstrap-vue-next mock itself has to stay in each spec file: vi.mock is
 * hoisted and scoped per module. Point it here so every spec shares one spy:
 *
 *   vi.mock('bootstrap-vue-next', async (importOriginal) => {
 *     const { toastCreate } = await import('../../support/form-harness.js')
 *     return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
 *   })
 *
 * Spread the original module - do not replace it wholesale. The auto-import
 * resolver rewrites <b-form-input> & friends into named imports from
 * bootstrap-vue-next, so a bare `{ useToast }` factory leaves every one of them
 * undefined and every template ref pointing at one of them null.
 */
export const toastCreate = vi.fn()

const realClients = new Map()
let http = null
let routerGoSpy = null

/**
 * Point a set of model singletons at a fake axios client and return it.
 *
 * BaseModel holds `axios` as an *instance* field, so assigning onto the model is
 * a complete seam - no vi.mock hoisting to reason about, and the real model code
 * (preInsert/preUpdate date formatting and the like) stays in the picture. The
 * models are module-level singletons shared with the component under test, so
 * the real clients are saved here and must be put back by restoreClients().
 *
 * `defaultGet` is what any GET other than the CSRF token resolves to. It differs
 * per form: autocomplete endpoints return a bare array, list() reads
 * response.data.results.
 */
export function installFakeClients(models, { defaultGet = { data: [] } } = {}) {
  http = {
    get: vi.fn((url) => {
      if (url === '/get-csrf-token/') {
        return Promise.resolve({ data: { token: 'csrf-token' } })
      }
      return Promise.resolve(defaultGet)
    }),
    post: vi.fn(() => Promise.resolve({ data: { id: 100 } })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  }

  for (const model of models) {
    realClients.set(model, model.axios)
    model.axios = http
  }

  return http
}

/** Put the real axios clients back. Call from afterEach. */
export function restoreClients() {
  for (const [model, client] of realClients.entries()) {
    model.axios = client
  }
  realClients.clear()
  http = null
}

/**
 * Mount a form view with the plugins the app installs.
 *
 * - A **real router**, not a global.mocks.$router stub: global.mocks patches
 *   only the options-API instance proxy, so it is invisible to useRouter().
 *   A real one works for both API styles, which is what lets a single spec run
 *   against an options-API and a <script setup> version of the same component.
 * - **componentMixin**, which main.js installs app-wide. Options-API templates
 *   resolve $trans and the isStaff/isAdmin family through it; without it the
 *   mount dies with `_ctx.$trans is not a function`. A <script setup> component
 *   imports $trans directly and does not need it, but installing it is harmless.
 * - **No stubs by default, and renderStubDefaultSlot on.** bootstrap-vue-next
 *   components are auto-imported by unplugin-vue-components, which the test
 *   config runs with the same resolvers as the app build, so shallowMount
 *   really does stub them - including b-overlay, which wraps the entire form
 *   body. Without renderStubDefaultSlot the whole template would vanish from
 *   the rendered output and every template ref inside it would be null.
 */
export function mountForm(component, { props = {}, stubs = {}, language = 'nl' } = {}) {
  const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: true })
  const mainStore = useMainStore()
  mainStore.getCurrentLanguage = language

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'home', component: { template: '<div />' } }],
  })
  routerGoSpy = vi.spyOn(router, 'go').mockImplementation(() => {})

  return shallowMount(component, {
    props,
    global: {
      plugins: [pinia, router],
      mixins: [componentMixin],
      renderStubDefaultSlot: true,
      stubs,
    },
  })
}

/** The router.go spy for the most recently mounted form. */
export function routerGo() {
  return routerGoSpy
}

/** URLs passed to a given verb, in call order. */
export function urls(verb) {
  return http[verb].mock.calls.map(([url]) => url)
}

/** Toast titles in call order. */
export function toastTitles() {
  return toastCreate.mock.calls.map(([{ title }]) => title)
}

import { beforeEach, vi } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createMemoryHistory, createRouter } from 'vue-router'
import { VueQueryPlugin } from '@tanstack/vue-query'

import componentMixin from '@/mixins/common'
import { queryClientOptions } from '@/services/query-client'
import { useAuthStore } from '@/stores/auth'
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

// Cleared between tests, here rather than in each spec. The spy is one
// module-level object shared by every test in a file, so without this a spec
// asserting that the user was told something can pass on a toast raised two
// tests ago - and one asserting the user was told *nothing* can never pass at
// all once any earlier test raised one.
beforeEach(() => toastCreate.mockClear())

/**
 * Baseline behaviour for a fake axios client that replaces the `@/services/api`
 * module itself.
 *
 * `installFakeClients` below works by assigning onto model *singletons*, which
 * is no help when the component does `new OrderService()` in its own setup -
 * that instance takes its `axios` from the `@/services/api` module at
 * construction time, so mocking the module is the only seam that reaches it.
 *
 * The mock's client must be created with `vi.hoisted` **in the spec**, not
 * imported from here:
 *
 *   const fakeHttp = vi.hoisted(() => ({
 *     get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
 *   }))
 *   vi.mock('@/services/api', () => ({ default: fakeHttp, normalClient: fakeHttp }))
 *
 * An `async` factory that imports this file instead deadlocks the run - vitest
 * is resolving `@/services/api`, this module's own imports reach it again
 * through `@/mixins/common`, and nothing ever finishes loading. The symptom is
 * a suite that hangs with no output at all rather than an error.
 *
 * Then `resetFakeHttp(fakeHttp, routes)` in beforeEach: the CSRF token
 * resolves, every other GET resolves to `routes[url]` if listed and to `[]`
 * otherwise, and writes succeed.
 */
export function resetFakeHttp(fakeHttp, routes = {}) {
  fakeHttp.get.mockReset()
  fakeHttp.post.mockReset()
  fakeHttp.patch.mockReset()
  fakeHttp.delete.mockReset()

  fakeHttp.get.mockImplementation((url) => {
    if (url === '/get-csrf-token/') {
      return Promise.resolve({ data: { token: 'csrf-token' } })
    }
    // Route keys omit the query string, but autocomplete calls now carry
    // `?q=...` (the generated client serializes `opts.query`). Match on the
    // path so a fixture keyed on `/api/.../autocomplete/` serves every query.
    const path = String(url).split('?')[0]
    if (path in routes) {
      // A fresh copy per call. The forms write back onto the object they were
      // given (`order.orderlines = processedOrderlines`), so handing out the
      // same fixture twice lets one test mangle the next one's data - a
      // failure that looks like a bug in the component under test.
      return Promise.resolve({ data: structuredClone(routes[path]) })
    }
    return Promise.resolve({ data: [] })
  })
  fakeHttp.post.mockResolvedValue({ data: { id: 100 } })
  fakeHttp.patch.mockResolvedValue({ data: {} })
  fakeHttp.delete.mockResolvedValue({ data: {} })

  return fakeHttp
}

/** URLs passed to a given verb on a client, in call order. */
export function urlsOf(fakeHttp, verb) {
  return fakeHttp[verb].mock.calls.map(([url]) => url)
}

// The SDK (`@/api/client.gen`) mock lives in ./api-client-mock.js, NOT here:
// a spec's `vi.mock('@/api/client.gen', async () => await import(...))` factory
// runs while the spec is still importing, and awaiting this file deadlocks
// (this module -> @/mixins/common -> @/utils -> ./api/sdk.gen -> ./client.gen).
// `apiClientMock` must stay in a dependency-free module; see the comment there.

/**
 * The query plugin, as main.ts installs it, with one override.
 *
 * The app's own options come from services/query-client.ts so a spec observes
 * the same stale window and the same 4xx-no-retry policy the application runs.
 * Retry itself is switched off because its backoff is real time — a 5xx would
 * surface to the user only after ~3s of exponential delays, which a DOM-driven
 * spec has no business waiting out (and `settle()` deliberately does not). What
 * a spec asserts is that the user was *told*; the schedule they were told on is
 * configuration, not behaviour.
 */
const queryPluginOptions = {
  ...queryClientOptions,
  queryClientConfig: {
    ...queryClientOptions.queryClientConfig,
    defaultOptions: {
      ...queryClientOptions.queryClientConfig.defaultOptions,
      queries: {
        ...queryClientOptions.queryClientConfig.defaultOptions.queries,
        retry: false,
      },
    },
  },
}


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
function build(
  component,
  {
    props = {},
    stubs = {},
    language = 'nl',
    main = {},
    auth = {},
    deep = false,
    query = {},
    routes = [],
  } = {},
) {
  const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: true })
  const mainStore = useMainStore()
  mainStore.getCurrentLanguage = language

  // Getters are writable on a testing pinia, which is the only practical way to
  // pin one whose real implementation would read through a null `memberInfo`
  // (`getMemberHasBranches` and friends). Pass what the form under test asks
  // for: `{ getMemberHasBranches: true }`.
  Object.assign(mainStore, main)

  // Seed the auth store here, not after mounting: a `<script setup>` component
  // runs its load() during setup, and the store reads before its first `await`
  // have already happened by the time mountForm returns.
  Object.assign(useAuthStore(), auth)

  const router = createRouter({
    history: createMemoryHistory(),
    // A deep mount renders the real <router-link>s in the form headers, which
    // resolve their `:to` at setup time and throw "No match for {name}" if the
    // route is unknown - so the names the form views link to have to exist
    // here. shallowMount never noticed because it stubbed them away.
    // `routes` adds the ones a particular screen links to. A view's own route
    // names are its business, not every spec's, so they are passed in rather
    // than accumulated here; see support/member-routes.js for one such set.
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/orders', name: 'order-list', component: { template: '<div />' } },
      { path: '/orders/:pk', name: 'order-view', component: { template: '<div />' } },
      ...routes,
    ],
  })
  routerGoSpy = vi.spyOn(router, 'go').mockImplementation(() => {})

  // `deep: true` renders the real bootstrap-vue-next inputs instead of stubbing
  // them, which is what a spec needs to drive a form the way a user does -
  // typing into `#order_reference` rather than assigning to `vm.order`. Pass
  // stubs for the third-party widgets that have no meaningful DOM under
  // happy-dom (datepicker, multiselect) and for children with an imperative
  // API.
  const mountFn = deep ? mount : shallowMount

  return {
    router,
    query,
    mount: () =>
      mountFn(component, {
        props,
        global: {
          plugins: [pinia, router, [VueQueryPlugin, queryPluginOptions]],
          mixins: [componentMixin],
          renderStubDefaultSlot: true,
          stubs,
        },
      }),
  }
}

export function mountForm(component, options = {}) {
  return build(component, options).mount()
}

/**
 * `mountForm` for a view that reads `$route` during setup, with `query` seeding
 * the route it reads.
 *
 * Async because it has to be. Until the router's first navigation settles,
 * `useRoute()` returns START_LOCATION with an empty query, and a list view
 * reads its page and search term in `setup()` - so mounting synchronously
 * hands it an empty route and quietly tests the defaults.
 *
 * The navigation is driven here rather than left to `app.use(router)`, which
 * is what would otherwise trigger it: `isReady()` cannot be awaited before
 * mounting, because nothing has installed the router yet and the promise it
 * returns would never settle. `replace` does not need the install.
 */
export async function mountListView(component, options = {}) {
  const { router, query, mount: mountIt } = build(component, options)
  await router.replace({ path: '/', query })

  return mountIt()
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

/**
 * Every toast shown, in call order, as `{title, body, variant}`.
 *
 * The *body* is where a failure says what failed - `errorToast` puts a bare
 * "Error" in the title and the message the user reads in the body - so a spec
 * pinning what a user was told after a save failure has to look here and not
 * at `toastTitles()`.
 */
export function toasts() {
  return toastCreate.mock.calls.map(([toast]) => toast)
}

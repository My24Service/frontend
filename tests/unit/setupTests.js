import { afterAll, afterEach, beforeAll, beforeEach, expect, vi } from 'vitest'
import { config, disableAutoUnmount, enableAutoUnmount } from '@vue/test-utils'

import { client as generatedClient } from '@/api/client.gen'
import legacyClient from '@/services/api'
import { inputDelays } from '@/services/input-delays'

import { toastCreate } from './support/toast.js'

// useToast() hands out the one shared spy, for every spec (read it through
// form-harness.js). Mocked here rather than per spec: a component graph that
// one spec loaded against the real module and the next against a mock is two
// graphs, which is what kept the suite from sharing one between spec files.
//
// Spread the original - do not replace it wholesale. The auto-import resolver
// rewrites <b-form-input> & friends into named imports from bootstrap-vue-next,
// so a bare `{ useToast }` factory leaves every one of them undefined.
vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()),
  useToast: () => ({ create: toastCreate }),
}))

// The full-page loading overlay, inert: `show()` hands back a handle whose
// `hide()` does nothing. No spec asserts the overlay itself, and a real one
// mounts outside the wrapper, where it would outlive the test. Mocked here for
// the same reason as the toast above: per-file mocks keep a spec out of the
// shared project.
vi.mock('vue-loading-overlay', async (importOriginal) => ({
  ...(await importOriginal()),
  useLoading: () => ({ show: () => ({ hide() {} }) }),
}))

// Every wrapper is unmounted after its test. A teleported modal stays in
// `document.body` otherwise, and the next test's `#search-modal` may be the
// previous test's (see support/modal.js).
//
// Disabled first because this file runs once per spec file, but in the shared
// project (vitest.config.js) @vue/test-utils is loaded once per worker, and it
// throws on a second enable. Re-enabling registers the hook with this spec
// file's afterEach rather than leaving it on the first file's.
disableAutoUnmount()
enableAutoUnmount(afterEach)

// bootstrap-vue-next components and the unplugin-icons `i-bi-*` components are
// resolved at compile time (see vitest.config.js). VueDatePicker is the one
// component main.js registers globally instead, so tests have to mirror that
// or every template using it warns "Failed to resolve component".
//
// A stub rather than the real `@vuepic/vue-datepicker`. This file runs once
// per spec file, so importing the library here costs ~1s of `setup` per file:
// ~209 CPU-seconds across the suite, about a fifth of the wall time. Nothing
// loses anything by it - `shallowMount` stubs the component anyway, the two
// deep mounts that render it stub it themselves, and form-harness.js already
// records that the real widget has no meaningful DOM under happy-dom.
const VueDatePickerStub = { name: 'VueDatePicker', template: '<div />' }

config.global.components = {
  ...config.global.components,
  VueDatePicker: VueDatePickerStub,
}

// A real `Storage`, because VueUse picks its sync channel by type.
//
// Node 22+ defines its own `localStorage` global, and without a
// --localstorage-file its getter yields undefined: it shadows the one happy-dom
// would put there, so `window.localStorage` is undefined too (`window` IS
// `globalThis` under vitest's happy-dom). The comment this replaces claimed
// happy-dom provides no localStorage and stubbed in a hand-rolled memory class,
// which was wrong in a way that mattered: `useStorage` listens for the native
// `storage` event only when `storage instanceof Storage`, and falls back to
// its private `vueuse-storage` CustomEvent otherwise - so every
// `useLocalStorage` in the suite, including the token in
// src/features/auth/token.ts, was tested against a channel the browser never
// uses. happy-dom's `Storage` is the same class the global `Storage` refers
// to, so an instance of it takes the native path.
//
// One per worker, not one per spec file. In the shared project
// (vitest.config.js) the app's modules are evaluated once per worker, so a
// `useLocalStorage` bound at import time keeps whichever instance existed then;
// a fresh instance per file would leave it reading a storage no spec can see.
// `localStorage.clear()` below keeps tests apart instead.
const testStorage = (globalThis.__my24TestStorage ??= new Storage())

Object.defineProperty(globalThis, 'localStorage', {
  value: testStorage,
  configurable: true,
  writable: true,
})
Object.defineProperty(window, 'localStorage', {
  value: testStorage,
  configurable: true,
  writable: true,
})

// `$trans` in src/utils.js falls back to returning its input when `window.django`
// is absent, which is what we want in tests. Some modules call `django.gettext`
// as a bare global though, so define a pass-through to keep those from throwing.
globalThis.django = {
  gettext: (text) => text,
}

// src/utils.js exposes $trans as a module export, but templates and a few
// modules reference it as a global.
globalThis.$trans = (text) => text

// The HTTP clients are one object each for the whole worker, and a spec that
// fakes the wire by assigning `defaults.adapter` changes them for every spec
// after it. Captured once, put back before every test.
// Keyed by instance, first sight wins: an isolated spec file has fresh clients,
// and a shared worker sees each one first while it is still untouched.
const realAdapters = (globalThis.__my24RealAdapters ??= new WeakMap())
const httpClients = [generatedClient.instance, legacyClient]
for (const client of httpClients) {
  if (!realAdapters.has(client)) realAdapters.set(client, client.defaults.adapter)
}

beforeEach(() => {
  // Each test starts from a clean global-config slate: `$trans` consults these.
  window.django = undefined
  window.member_type_text = undefined
  localStorage.clear()
  vi.restoreAllMocks()
  for (const client of httpClients) client.defaults.adapter = realAdapters.get(client)
  // One spy for every test in the run. Without this a spec asserting that the
  // user was told something can pass on a toast raised two tests ago.
  toastCreate.mockClear()
  // No debounce waits: input acts the moment it is typed. Sleeping through the
  // real 250-500 ms delays was about a quarter of the suite's test time. A spec
  // that asserts a delay sets it for that test, from DEFAULT_INPUT_DELAYS.
  inputDelays.typingMs = 0
  inputDelays.tableFilterMs = 0
  inputDelays.optionSearchMs = 0
})

// In the shared project (vitest.config.js) a worker keeps one window, and one
// module graph, for every spec file it runs. A spec that replaces `location`
// without undoing it breaks whichever file runs next in that worker - the
// router, the websocket URL and the redirect helpers all read it - and that
// file's failure says nothing about the cause. So check on the way in, and
// name the file that ran before.
const isRealLocation = (value) => value instanceof window.Location

if (!isRealLocation(window.location) || !isRealLocation(document.location)) {
  throw new Error(
    `\`location\` was replaced and left in place by ${globalThis.__my24PreviousSpec ?? 'an earlier spec'}. ` +
      "Use vi.stubGlobal('location', ...) or vi.spyOn(document, 'location', 'get'), " +
      'which are undone after each test.',
  )
}

// Same for the one localStorage: a spec that replaced one of its methods and
// could not put it back leaves every later file unable to persist anything.
let storageWorks = false
try {
  localStorage.setItem('__my24_probe', '1')
  storageWorks = localStorage.getItem('__my24_probe') === '1'
  localStorage.removeItem('__my24_probe')
} catch {
  // reported below
}
if (!storageWorks) {
  throw new Error(
    `localStorage can no longer write, left that way by ${globalThis.__my24PreviousSpec ?? 'an earlier spec'}. ` +
      "Replace a Storage method with Object.defineProperty and put the original back; vi.spyOn on happy-dom's " +
      'Storage cannot be restored.',
  )
}

// Under Stryker (`npm run test:mutation`) a test gets a minute, not 5s. The
// machine is loaded - typescript checkers compiling, several test runners, one
// vitest thread each over instrumented code - and a test that takes 0.2s on its
// own has been seen to hit the 5s default.
//
// In the initial test run that aborts the whole mutation run. In a mutant run
// it is worse: a vitest timeout is a failed test, so Stryker reports the
// mutant as Killed. Re-run with a long timeout, 18 of 72 such "kills" in
// src/features turned out to survive. With a minute, a mutant that really hangs
// the code is caught by Stryker's own timeout instead (timeoutMS in
// stryker.config.json) and reported as Timeout - slower, since the runner is
// restarted, but not a false kill.
//
// `vi.setConfig` here applies to this spec file and is reset by vitest after it.
if (process.env.STRYKER_MUTATOR_WORKER !== undefined) {
  vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 })
}

let specFile
beforeAll(() => {
  specFile = expect.getState().testPath
})
afterAll(() => {
  globalThis.__my24PreviousSpec = specFile
  // `unstubGlobals` in vitest.config.js undoes stubs *before* each test, so a
  // stub made by a file's last test would otherwise still be in place while the
  // next file in the worker imports its modules.
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

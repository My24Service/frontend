import { beforeEach, vi } from 'vitest'
import { config } from '@vue/test-utils'

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
const testStorage = new Storage()

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

beforeEach(() => {
  // Each test starts from a clean global-config slate: `$trans` consults these.
  window.django = undefined
  window.member_type_text = undefined
  localStorage.clear()
  vi.restoreAllMocks()
})

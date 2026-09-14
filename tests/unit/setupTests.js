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

// happy-dom 20 does not provide localStorage, and the auth store reads the
// access token from it at store-creation time. A minimal in-memory stand-in is
// enough, and lets tests set/inspect the token directly.
class MemoryStorage {
  #items = new Map()

  getItem(key) {
    return this.#items.has(key) ? this.#items.get(key) : null
  }

  setItem(key, value) {
    this.#items.set(key, String(value))
  }

  removeItem(key) {
    this.#items.delete(key)
  }

  clear() {
    this.#items.clear()
  }

  key(index) {
    return [...this.#items.keys()][index] ?? null
  }

  get length() {
    return this.#items.size
  }
}

const localStorageStub = new MemoryStorage()
globalThis.localStorage = localStorageStub
window.localStorage = localStorageStub

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

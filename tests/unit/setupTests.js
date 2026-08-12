import { beforeEach, vi } from 'vitest'

// There is a circular import in src: models/base -> services/api ->
// auth/clientDriver -> stores/auth -> stores/main -> utils -> models/orders/Order
// -> models/base. Whether it resolves depends on which module the graph is
// entered through: entering via stores/main or utils is fine, entering via
// models/base or services/my24 leaves BaseModel undefined at class-extends time.
// The app entry (main.js) happens to take a safe path; a spec importing a model
// directly does not. Importing a safe entry point here primes the graph for
// every spec. Remove this once the cycle itself is broken.
import '@/stores/main'

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

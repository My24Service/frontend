import { beforeEach, vi } from 'vitest'

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

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import TheLanguageChooser from '@/components/TheLanguageChooser.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Behaviour characterisation for the language chooser
 * (src/components/TheLanguageChooser.vue).
 *
 * Seams under test: the options built from the main store, the wire body,
 * and the ordering POST then store write then reload. This widget stays in
 * app chrome: locale preference on the main store is not account domain. The
 * failure path stays silent apart from console.log, like the code.
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

const LANGUAGES_IN = [
  ['nl', 'Nederlands'],
  ['en', 'English'],
]

const MAIN = {
  getCurrentLanguage: 'en',
  getLanguages: LANGUAGES_IN,
  setLanguage: vi.fn(),
}

function posts() {
  return requestShapes(fakeHttp, { method: 'post' })
}

beforeEach(() => {
  resetFakeHttp(fakeHttp)
  MAIN.setLanguage.mockClear()
  vi.stubGlobal('location', { reload: vi.fn() })
})

describe('TheLanguageChooser', () => {
  test('it offers the languages from the main store', async () => {
    const wrapper = mountForm(TheLanguageChooser, { deep: true, main: MAIN })
    await flush()

    const options = wrapper.findAll('option').map((option) => option.text())
    expect(options).toContain('Nederlands (nl)')
    expect(options).toContain('English (en)')
  })

  test('it starts on the current language', async () => {
    const wrapper = mountForm(TheLanguageChooser, { deep: true, main: MAIN })
    await flush()

    expect(wrapper.vm.selected).toBe('en')
  })

  test('choosing posts the language, writes the store, then reloads', async () => {
    const wrapper = mountForm(TheLanguageChooser, { deep: true, main: MAIN })
    await flush()

    await wrapper.get('select').setValue('nl')
    await wrapper.get('.btn-primary').trigger('click')
    await until(() => posts().length > 0)

    expect(posts()).toEqual([
      {
        method: 'post',
        path: '/api/set-language/',
        query: {},
        body: { language: 'nl' },
      },
    ])
    expect(MAIN.setLanguage).toHaveBeenCalledWith('nl')
    expect(window.location.reload).toHaveBeenCalled()
  })

  test('a failed post writes nothing and reloads nothing', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    fakeHttp.post.mockRejectedValueOnce(new Error('boom'))
    const wrapper = mountForm(TheLanguageChooser, { deep: true, main: MAIN })
    await flush()

    await wrapper.get('select').setValue('nl')
    await wrapper.get('.btn-primary').trigger('click')
    await until(() => log.mock.calls.length > 0)

    expect(MAIN.setLanguage).not.toHaveBeenCalled()
    expect(window.location.reload).not.toHaveBeenCalled()
  })
})

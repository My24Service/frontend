import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

import TheLanguageChooser from '@/components/TheLanguageChooser.vue'

import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

/**
 * Behaviour characterisation for the language chooser
 * (src/components/TheLanguageChooser.vue).
 *
 * Seams under test: the options built from the main store, the wire body,
 * and the ordering POST then store write then reload. The seam sits below
 * both HTTP clients, so this spec records the request that would go on the
 * wire and rejects a body the endpoint's request schema rejects. This widget
 * stays in app chrome: locale preference on the main store is not account
 * domain. The failure path stays silent apart from console.log, like the
 * code.
 */

enableAutoUnmount(afterEach)

const api = installApiSeam()

const SET_LANGUAGE = '/api/set-language/'

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
  return api.requests().filter((sent) => sent.method === 'post')
}

async function until(condition, { attempts = 200 } = {}) {
  for (let i = 0; i < attempts; i++) {
    if (condition()) return
    await settle()
  }
  throw new Error('condition never became true')
}

beforeEach(() => {
  MAIN.setLanguage.mockClear()
  vi.stubGlobal('location', { reload: vi.fn() })
  // The endpoint answers with no body; the seam's void contract is an
  // explicit empty 204.
  api.post(SET_LANGUAGE, noContent)
})

describe('TheLanguageChooser', () => {
  test('it offers the languages from the main store', async () => {
    const wrapper = mountForm(TheLanguageChooser, { deep: true, main: MAIN })
    await settle()

    const options = wrapper.findAll('option').map((option) => option.text())
    expect(options).toContain('Nederlands (nl)')
    expect(options).toContain('English (en)')
  })

  test('it starts on the current language', async () => {
    const wrapper = mountForm(TheLanguageChooser, { deep: true, main: MAIN })
    await settle()

    expect(wrapper.vm.selected).toBe('en')
  })

  test('choosing posts the language, writes the store, then reloads', async () => {
    const wrapper = mountForm(TheLanguageChooser, { deep: true, main: MAIN })
    await settle()

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
    try {
      const wrapper = mountForm(TheLanguageChooser, { deep: true, main: MAIN })
      await settle()

      await wrapper.get('select').setValue('nl')
      // Register the failure after the mount so the mount itself stays quiet.
      api.post(SET_LANGUAGE, serverError)
      await wrapper.get('.btn-primary').trigger('click')
      await until(() => log.mock.calls.length > 0)

      expect(MAIN.setLanguage).not.toHaveBeenCalled()
      expect(window.location.reload).not.toHaveBeenCalled()
    } finally {
      log.mockRestore()
    }
  })
})

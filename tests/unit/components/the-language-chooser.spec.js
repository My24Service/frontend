import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import Vuex from "vuex"

import TheLanguageChooser from '@/components/TheLanguageChooser.vue'


describe('TheLanguageChooser.vue', () => {
  let store
  let getters

  beforeEach(() => {
    getters = {
      getLanguages: () => [
        ['en', 'English'],
        ['nl', 'Nederlands'],
      ],
      getCurrentLanguage: () => 'en'
    }

    store = new Vuex.Store({
      getters
    })
  })

  test('exists', () => {
    const wrapper = shallowMount(TheLanguageChooser, {
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    const container = wrapper.findComponent({ ref: 'language-chooser' })
    expect(container.exists()).to.be.true
  })
})

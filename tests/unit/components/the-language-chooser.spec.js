import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import Vuex from "vuex"

import TheLanguageChooser from '@/components/TheLanguageChooser.vue'
import localVue from '../index'


describe('TheLanguageChooser.vue', () => {
  let state
  let store

  beforeEach(() => {
    state = {
      currentLanguage: 'en'
    }

    store = new Vuex.Store({
      state
    })
  })

  it('exists', () => {
    const wrapper = shallowMount(TheLanguageChooser, {
      localVue,
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    const container = wrapper.findComponent({ ref: 'language-chooser' })
    expect(container.exists()).to.be.true
  })
})

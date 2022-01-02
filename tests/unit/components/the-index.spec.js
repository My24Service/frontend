import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import Vuex from "vuex"

import TheIndex from '@/components/TheIndex.vue'
import localVue from '../index'


describe('TheIndex.vue', () => {
  let state
  let store

  beforeEach(() => {
    state = {
      memberInfo: {}
    }

    store = new Vuex.Store({
      state
    })
  })

  it('exists', () => {
    const wrapper = shallowMount(TheIndex, {
      localVue,
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    const theindex = wrapper.findComponent({ ref: 'index' })
    expect(theindex.exists()).to.be.true
  })
})

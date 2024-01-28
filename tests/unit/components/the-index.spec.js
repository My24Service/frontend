import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import Vuex from "vuex"

import TheIndex from '@/components/TheIndex.vue'


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

  test('exists', () => {
    const wrapper = shallowMount(TheIndex, {
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    const theindex = wrapper.findComponent({ ref: 'index' })
    expect(theindex.exists()).to.be.true
  })
})

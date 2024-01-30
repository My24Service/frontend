import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import Vuex from "vuex"

import TheNav from '@/components/TheNav.vue'


describe('TheNav.vue', () => {
  let getters
  let store

  beforeEach(() => {
    getters = {
      getMemberLogo: () => 'hello.jpg',
      getMemberName: () => 'My name'
    }

    store = new Vuex.Store({
      getters
    })
  })

  test('has nav container', () => {
    const wrapper = shallowMount(TheNav, {
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    const modal = wrapper.findComponent({ ref: 'nav-container' })
    expect(modal.exists()).to.be.true
  })

})

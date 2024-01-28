import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import Vuex from "vuex"

import TheNavNotLoggedIn from '@/components/TheNavNotLoggedIn.vue'


describe('TheNavNotLoggedIn.vue', () => {
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

  test('has login modal', () => {
    const wrapper = shallowMount(TheNavNotLoggedIn, {
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    const modal = wrapper.findComponent({ ref: 'login-modal-component' })
    expect(modal.exists()).to.be.true
  })

})

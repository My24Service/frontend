import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import Vuex from "vuex"

import TheNavLoggedIn from '@/components/TheNavLoggedIn.vue'


describe('TheNavLoggedIn.vue', () => {
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

  test('has logout-modal', () => {
    const wrapper = shallowMount(TheNavLoggedIn, {
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    const modal = wrapper.findComponent({ ref: 'logout-modal' })
    expect(modal.exists()).to.be.true
  })

  test('has password-change-modal', () => {
    const wrapper = shallowMount(TheNavLoggedIn, {
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    const modal = wrapper.findComponent({ ref: 'password-change-modal' })
    expect(modal.exists()).to.be.true
  })
})

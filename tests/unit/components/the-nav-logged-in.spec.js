import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import Vuex from "vuex"

import TheNavLoggedIn from '@/components/TheNavLoggedIn.vue'
import localVue from '../index'


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

  it('has logout-modal', () => {
    const wrapper = shallowMount(TheNavLoggedIn, {
      localVue,
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    const modal = wrapper.findComponent({ ref: 'logout-modal' })
    expect(modal.exists()).to.be.true
  })

  it('has password-change-modal', () => {
    const wrapper = shallowMount(TheNavLoggedIn, {
      localVue,
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    const modal = wrapper.findComponent({ ref: 'password-change-modal' })
    expect(modal.exists()).to.be.true
  })
})

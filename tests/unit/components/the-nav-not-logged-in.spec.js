import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import Vuex from "vuex"

import TheNavNotLoggedIn from '@/components/TheNavNotLoggedIn.vue'
import localVue from '../index'


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

  it('has login modal', () => {
    const wrapper = shallowMount(TheNavNotLoggedIn, {
      localVue,
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    const modal = wrapper.findComponent({ ref: 'login-modal' })
    expect(modal.exists()).to.be.true
  })

})

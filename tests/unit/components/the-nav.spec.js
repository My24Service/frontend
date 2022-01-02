import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import Vuex from "vuex"

import TheNav from '@/components/TheNav.vue'
import localVue from '../index'


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

  it('has nav container', () => {
    const wrapper = shallowMount(TheNav, {
      localVue,
      store,
      mocks: {
        $trans: (t) => t
      }
    })

    const modal = wrapper.findComponent({ ref: 'nav-container' })
    expect(modal.exists()).to.be.true
  })

})

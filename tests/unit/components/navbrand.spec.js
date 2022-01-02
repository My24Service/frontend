import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import localVue from '../index'
import NavBrand from '@/components/NavBrand.vue'

describe('NavBrand.vue', () => {
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

  it('exists', () => {
    const wrapper = shallowMount(NavBrand, {
      localVue,
      store
    })
    const navbrand = wrapper.findComponent({ ref: 'nav-brand' })
    expect(navbrand.exists()).to.be.true
  })
})

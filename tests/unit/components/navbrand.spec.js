import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
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

  test('exists', () => {
    const wrapper = shallowMount(NavBrand, {
      store
    })
    const navbrand = wrapper.findComponent({ ref: 'nav-brand' })
    expect(navbrand.exists()).to.be.true
  })
})

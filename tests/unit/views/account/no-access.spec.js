import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Vuex from 'vuex'

import localVue from '../../index'
import NoAccess from '@/views/account/NoAccess.vue'


describe('NoAccess.vue - logged in', () => {
  let store
  let getters

  beforeEach(() => {
    getters = {
      isLoggedIn: () => true,
    }

    store = new Vuex.Store({
      getters,
    })
  })

  it('exists', async () => {
    const wrapper = shallowMount(NoAccess, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(NoAccess)
    expect(el.exists()).to.be.true
  })

  it('has "enough rights', async () => {
    const wrapper = mount(NoAccess, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('enough rights')
  })

  it('doesn\'t have "Please login', async () => {
    const wrapper = mount(NoAccess, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('Please login')
  })
})

describe('NoAccess.vue - not logged in', () => {
  let store
  let getters

  beforeEach(() => {
    getters = {
      isLoggedIn: () => false,
    }

    store = new Vuex.Store({
      getters,
    })
  })

  it('exists', async () => {
    const wrapper = shallowMount(NoAccess, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(NoAccess)
    expect(el.exists()).to.be.true
  })

  it('doesn\'t have "enough rights', async () => {
    const wrapper = mount(NoAccess, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('enough rights')
  })

  it('has "Please login', async () => {
    const wrapper = mount(NoAccess, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Please login')
  })
})

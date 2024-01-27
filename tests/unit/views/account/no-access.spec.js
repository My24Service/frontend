import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Vuex from 'vuex'

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

  test('exists', async () => {
    const wrapper = shallowMount(NoAccess, {
      store,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(NoAccess)
    expect(el.exists()).to.be.true
  })

  test('has "enough rights', async () => {
    const wrapper = mount(NoAccess, {
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('enough rights')
  })

  test('doesn\'t have "Please login', async () => {
    const wrapper = mount(NoAccess, {
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

  test('exists', async () => {
    const wrapper = shallowMount(NoAccess, {
      store,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(NoAccess)
    expect(el.exists()).to.be.true
  })

  test('doesn\'t have "enough rights', async () => {
    const wrapper = mount(NoAccess, {
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('enough rights')
  })

  test('has "Please login', async () => {
    const wrapper = mount(NoAccess, {
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

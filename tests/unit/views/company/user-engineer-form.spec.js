import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Vuex from "vuex"

import UserEngineerForm from '@/views/company/UserEngineerForm.vue'
import userEngineerResponse from '../../fixtures/user-engineer'
import locationsResponse from '../../fixtures/stocklocations'

vi.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/company/engineer/1/':
      return Promise.resolve(userEngineerResponse)
    case '/inventory/stock-location/?page=1':
      return Promise.resolve(locationsResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('UserEngineerForm.vue', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getCountries: () => [],
    }

    store = new Vuex.Store({
      actions,
    })
  })

  test('exists', async () => {
    const wrapper = shallowMount(UserEngineerForm, {
      store,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(UserEngineerForm)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "New engineer"', async () => {
    const wrapper = mount(UserEngineerForm, {
      store,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New engineer</h2>')
  })

  test('edit, contains "Edit engineer"', async () => {
    const wrapper = mount(UserEngineerForm, {
      store,
      mocks: {
        $trans: (f) => f,
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>Edit engineer</h2>')
  })
})

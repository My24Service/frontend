import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import UserEmployeeForm from '../../../../src/views/company/UserEmployeeForm.vue'
import userEmployeeResponse from '../../fixtures/user-employee'
import branchesResponse from '../../fixtures/branches'
import Vuex from "vuex";

vi.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/company/branch/?page=1':
      return Promise.resolve(branchesResponse)
    case '/company/employeeuser/1/':
      return Promise.resolve(userEmployeeResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('UserEmployeeForm.vue', () => {
  let store
  let getters

  beforeEach(() => {
    getters = {
      getMemberHasBranches: () => true
    }

    store = new Vuex.Store({
      getters,
    })
  })

  test('exists', async () => {
    const wrapper = shallowMount(UserEmployeeForm, {
      store,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(UserEmployeeForm)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "New employee"', async () => {
    const wrapper = mount(UserEmployeeForm, {
      store,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New employee</h2>')
  })

  test('edit, contains "Edit employee"', async () => {
    const wrapper = mount(UserEmployeeForm, {
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
    expect(html).to.contain('<h2>Edit employee</h2>')
  })
})

import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import UserEmployeeForm from '../../../../src/views/company/UserEmployeeForm.vue'
import userEmployeeResponse from '../../fixtures/user-employee'

jest.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/company/employeeuser/1/':
      return Promise.resolve(userEmployeeResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('UserEmployeeForm.vue', () => {
  it('exists', async () => {
    const wrapper = shallowMount(UserEmployeeForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(UserEmployeeForm)
    expect(el.exists()).to.be.true
  })

  it('insert, contains "New employee"', async () => {
    const wrapper = mount(UserEmployeeForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New employee</h2>')
  })

  it('edit, contains "Edit employee"', async () => {
    const wrapper = mount(UserEmployeeForm, {
      localVue,
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

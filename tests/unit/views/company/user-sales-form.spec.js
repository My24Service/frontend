import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import UserSalesForm from '@/views/company/UserSalesForm.vue'
import userSalesResponse from '../../fixtures/user-sales'

jest.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/company/salesuser/1/':
      return Promise.resolve(userSalesResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('UserSalesForm.vue', () => {
  it('exists', async () => {
    const wrapper = shallowMount(UserSalesForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(UserSalesForm)
    expect(el.exists()).to.be.true
  })

  it('insert, contains "New sales user"', async () => {
    const wrapper = mount(UserSalesForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New sales user</h2>')
  })

  it('edit, contains "Edit sales user"', async () => {
    const wrapper = mount(UserSalesForm, {
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
    expect(html).to.contain('<h2>Edit sales user</h2>')
  })
})

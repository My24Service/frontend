import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import UserCustomerForm from '@/views/company/UserCustomerForm.vue'
import userCustomerResponse from '../../fixtures/user-customer'

vi.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/company/customeruser/1/':
      return Promise.resolve(userCustomerResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('UserCustomerForm.vue', () => {
  test('exists', async () => {
    const wrapper = shallowMount(UserCustomerForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(UserCustomerForm)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "New customer user"', async () => {
    const wrapper = mount(UserCustomerForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New customer user</h2>')
  })

  test('edit, contains "Edit customer user"', async () => {
    const wrapper = mount(UserCustomerForm, {
      mocks: {
        $trans: (f) => f,
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>Edit customer user</h2>')
  })
})

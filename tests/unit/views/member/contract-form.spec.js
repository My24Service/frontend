import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import ContractForm from '@/views/member/ContractForm.vue'
import contractResponse from '../../fixtures/contract'
import moduleDataResponse from '../../fixtures/module-data'

jest.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/member/get-module-data/':
      return Promise.resolve(moduleDataResponse)
    case '/member/contract/1/':
      return Promise.resolve(contractResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('ContractForm.vue', () => {
  it('exists', async () => {
    const wrapper = shallowMount(ContractForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ContractForm)
    expect(el.exists()).to.be.true
  })

  it('insert, contains "New contract"', async () => {
    const wrapper = mount(ContractForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New contract</h2>')
  })

  it('edit, contains "Edit contract"', async () => {
    const wrapper = mount(ContractForm, {
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
    expect(html).to.contain('<h2>Edit contract</h2>')
  })
})

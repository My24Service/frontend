import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import ContractForm from '@/views/member/ContractForm.vue'
import contractResponse from '../../fixtures/contract'
import moduleDataResponse from '../../fixtures/module-data'

vi.mock('axios')

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
  test('exists', async () => {
    const wrapper = shallowMount(ContractForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ContractForm)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "New contract"', async () => {
    const wrapper = mount(ContractForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('New contract</h2>')
  })

  test('edit, contains "Edit contract"', async () => {
    const wrapper = mount(ContractForm, {
      mocks: {
        $trans: (f) => f,
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Edit contract</h2>')
  })
})

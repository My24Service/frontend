import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'

import localVue from '../../index'
import ContractList from '@/views/member/ContractList.vue'
import contractResponse from '../../fixtures/contracts'

jest.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'contract-add'
},
{
  path: '/hello/world',
  name: 'contract-edit'
},
]

const router = new VueRouter({routes})


describe('ContractList.vue', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(contractResponse);

    const wrapper = shallowMount(ContractList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ContractList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(contractResponse);

    const wrapper = mount(ContractList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#contract-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValueOnce(contractResponse);

    const wrapper = mount(ContractList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Test')
    expect(html).to.contain('Test 2')
  })
})

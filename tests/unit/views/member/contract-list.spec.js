import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'

import ContractList from '@/views/member/ContractList.vue'
import contractResponse from '../../fixtures/contracts'

vi.mock('axios')

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
  test('exists', async () => {
    axios.get.mockResolvedValue(contractResponse);

    const wrapper = shallowMount(ContractList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ContractList)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(contractResponse);

    const wrapper = mount(ContractList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#contract-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

  test('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValue(contractResponse);

    const wrapper = mount(ContractList, {
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

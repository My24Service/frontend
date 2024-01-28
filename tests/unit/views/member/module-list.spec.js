import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'

import ModuleList from '@/views/member/ModuleList.vue'
import moduleResponse from '../../fixtures/modules'

vi.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'module-add'
},
{
  path: '/hello/world',
  name: 'module-edit'
},
]

const router = new VueRouter({routes})


describe('ModuleList.vue', () => {
  test('exists', async () => {
    axios.get.mockResolvedValue(moduleResponse);

    const wrapper = shallowMount(ModuleList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ModuleList)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(moduleResponse);

    const wrapper = mount(ModuleList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#module-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

  test('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValue(moduleResponse);

    const wrapper = mount(ModuleList, {
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

import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'

import ModulePartList from '@/views/member/ModulePartList.vue'
import modulePartResponse from '../../fixtures/module-parts'

vi.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'module-part-add'
},
{
  path: '/hello/world',
  name: 'module-part-edit'
},
]

const router = new VueRouter({routes})


describe('ModulePartList.vue', () => {
  test('exists', async () => {
    axios.get.mockResolvedValue(modulePartResponse);

    const wrapper = shallowMount(ModulePartList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ModulePartList)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(modulePartResponse);

    const wrapper = mount(ModulePartList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#module-part-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

  test('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValue(modulePartResponse);

    const wrapper = mount(ModulePartList, {
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

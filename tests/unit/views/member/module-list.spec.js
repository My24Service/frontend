import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'

import localVue from '../../index'
import ModuleList from '@/views/member/ModuleList.vue'
import moduleResponse from '../../fixtures/modules'

jest.mock('axios')

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
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(moduleResponse);

    const wrapper = shallowMount(ModuleList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ModuleList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(moduleResponse);

    const wrapper = mount(ModuleList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#module-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValueOnce(moduleResponse);

    const wrapper = mount(ModuleList, {
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

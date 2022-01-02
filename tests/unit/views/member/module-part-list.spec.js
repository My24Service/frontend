import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'

import localVue from '../../index'
import ModulePartList from '@/views/member/ModulePartList.vue'
import modulePartResponse from '../../fixtures/module-parts'

jest.mock('axios')

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
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(modulePartResponse);

    const wrapper = shallowMount(ModulePartList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(ModulePartList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(modulePartResponse);

    const wrapper = mount(ModulePartList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#module-part-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValueOnce(modulePartResponse);

    const wrapper = mount(ModulePartList, {
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

import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import StatuscodeList from '@/views/shared/StatuscodeList.vue'
import statuscodesResponse from '../../fixtures/statuscodes'

jest.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'order-statuscode-action-add'
},
{
  path: '/hello/world',
  name: 'order-statuscode-edit'
},
{
  path: '/hello/world',
  name: 'order-statuscode-action-edit'
},
{
  path: '/hello/world',
  name: 'order-statuscode-add'
},
]

const router = new VueRouter({routes})


describe('StatuscodeList.vue - order', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(statuscodesResponse);

    const wrapper = shallowMount(StatuscodeList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        list_type: 'order',
      }
    })

    await flushPromises()

    const el = wrapper.findComponent(StatuscodeList)
    expect(el.exists()).to.be.true
  })

  it('has two rows - order', async () => {
    axios.get.mockResolvedValueOnce(statuscodesResponse);

    const wrapper = mount(StatuscodeList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        list_type: 'order',
      }
    })

    await flushPromises()

    const trs = wrapper.findAll('#statuscode-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "Start order?" - order', async () => {
    axios.get.mockResolvedValueOnce(statuscodesResponse);

    const wrapper = mount(StatuscodeList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        list_type: 'order',
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Start order?')
  })

  it('does not contain "Start trip?" - order', async () => {
    axios.get.mockResolvedValueOnce(statuscodesResponse);

    const wrapper = mount(StatuscodeList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        list_type: 'order',
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('Start trip?')
  })
})

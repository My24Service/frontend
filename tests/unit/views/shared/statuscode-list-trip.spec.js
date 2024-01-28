import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import StatuscodeList from '@/views/shared/StatuscodeList.vue'
import statuscodesResponse from '../../fixtures/trip-statuscodes'

vi.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'trip-statuscode-action-add'
},
{
  path: '/hello/world',
  name: 'trip-statuscode-edit'
},
{
  path: '/hello/world',
  name: 'trip-statuscode-action-edit'
},
{
  path: '/hello/world',
  name: 'trip-statuscode-add'
},
]

const router = new VueRouter({routes})


describe('StatuscodeList.vue - trip', () => {
  test('exists', async () => {
    axios.get.mockResolvedValue(statuscodesResponse);

    const wrapper = shallowMount(StatuscodeList, {
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        list_type: 'trip',
      }
    })

    await flushPromises()

    const el = wrapper.findComponent(StatuscodeList)
    expect(el.exists()).to.be.true
  })

  test('has two rows - trip', async () => {
    axios.get.mockResolvedValue(statuscodesResponse);

    const wrapper = mount(StatuscodeList, {
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        list_type: 'trip',
      }
    })

    await flushPromises()

    const trs = wrapper.findAll('#statuscode-table > tbody > tr.statuscode-row')
    expect(trs.length).toBe(2)
  })

  test('does not contain "Start order?" - trip', async () => {
    axios.get.mockResolvedValue(statuscodesResponse);

    const wrapper = mount(StatuscodeList, {
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        list_type: 'trip',
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('Start order?')
  })

  test('contains "Start trip?" - trip', async () => {
    axios.get.mockResolvedValue(statuscodesResponse);

    const wrapper = mount(StatuscodeList, {
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        list_type: 'trip',
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Start trip?')
  })
})

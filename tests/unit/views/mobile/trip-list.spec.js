import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import TripList from '@/views/mobile/TripList.vue'
import tripsResponse from '../../fixtures/trips'

vi.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'mobile-trips-add'
},
{
  path: '/hello/world',
  name: 'mobile-trips-edit'
},
]

const router = new VueRouter({routes})


describe('TripList.vue', () => {
  test('exists', async () => {
    axios.get.mockResolvedValue(tripsResponse);

    const wrapper = shallowMount(TripList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(TripList)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(tripsResponse);

    const wrapper = mount(TripList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#trip-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

  test('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValue(tripsResponse);

    const wrapper = mount(TripList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('test')
    expect(html).to.contain('test 2')
  })
})

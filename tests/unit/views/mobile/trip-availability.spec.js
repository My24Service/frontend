import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import TripAvailability from '@/views/mobile/TripAvailability.vue'
import tripAvailabilityResponse from '../../fixtures/trip-availability-list'

vi.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'mobile-trip-availability-detail'
},
]

const router = new VueRouter({routes})


describe('TripAvailability.vue', () => {
  test('exists', async () => {
    axios.get.mockResolvedValue(tripAvailabilityResponse);

    const wrapper = shallowMount(TripAvailability, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(TripAvailability)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(tripAvailabilityResponse);

    const wrapper = mount(TripAvailability, {
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
    axios.get.mockResolvedValue(tripAvailabilityResponse);

    const wrapper = mount(TripAvailability, {
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

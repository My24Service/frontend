import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import TripAvailability from '@/views/mobile/TripAvailability.vue'
import tripAvailabilityResponse from '../../fixtures/trip-availability-list'

jest.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'mobile-trip-availability-detail'
},
]

const router = new VueRouter({routes})


describe('TripAvailability.vue', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(tripAvailabilityResponse);

    const wrapper = shallowMount(TripAvailability, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(TripAvailability)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(tripAvailabilityResponse);

    const wrapper = mount(TripAvailability, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#trip-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "test" and "test 2"', async () => {
    axios.get.mockResolvedValueOnce(tripAvailabilityResponse);

    const wrapper = mount(TripAvailability, {
      localVue,
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

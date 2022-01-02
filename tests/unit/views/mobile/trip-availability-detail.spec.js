import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import TripAvailabilityDetail from '@/views/mobile/TripAvailabilityDetail.vue'
import tripAvailabilityResponse from '../../fixtures/trip-availability-detail'

jest.mock('axios')

describe('TripAvailabilityDetail.vue', () => {
  it('has TripAvailabilityDetail component', async () => {
    axios.get.mockResolvedValueOnce(tripAvailabilityResponse);

    const wrapper = shallowMount(TripAvailabilityDetail, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(TripAvailabilityDetail)
    expect(el.exists()).to.be.true
  })

  it('has 1 available users rows', async () => {
    axios.get.mockResolvedValueOnce(tripAvailabilityResponse);

    const wrapper = mount(TripAvailabilityDetail, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#available-users-table tbody tr')
    expect(trs.length).to.equal(1)
  })

  it('has 0 assigned users rows', async () => {
    axios.get.mockResolvedValueOnce(tripAvailabilityResponse);

    const wrapper = mount(TripAvailabilityDetail, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#assigned-users-table tbody tr')
    expect(trs.length).to.equal(0)
  })

})


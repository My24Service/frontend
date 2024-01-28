import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import TripAvailabilityDetail from '@/views/mobile/TripAvailabilityDetail.vue'
import tripAvailabilityResponse from '../../fixtures/trip-availability-detail'

vi.mock('axios')

describe('TripAvailabilityDetail.vue', () => {
  test('has TripAvailabilityDetail component', async () => {
    axios.get.mockResolvedValue(tripAvailabilityResponse);

    const wrapper = shallowMount(TripAvailabilityDetail, {
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(TripAvailabilityDetail)
    expect(el.exists()).to.be.true
  })

  test('has 1 available users rows', async () => {
    axios.get.mockResolvedValue(tripAvailabilityResponse);

    const wrapper = mount(TripAvailabilityDetail, {
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#available-users-table tbody tr')
    expect(trs.length).toBe(1)
  })

  test('has 0 assigned users rows', async () => {
    axios.get.mockResolvedValue(tripAvailabilityResponse);

    const wrapper = mount(TripAvailabilityDetail, {
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#assigned-users-table tbody tr')
    expect(trs.length).toBe(0)
  })

})


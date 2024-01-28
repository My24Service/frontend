import axios from 'axios'
import { describe, expect, vi, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import Dashboard from '@/views/company/Dashboard.vue'
import dashboardResponse from '../../fixtures/dashboard'

vi.mock('axios')

describe('Dashboard.vue', () => {
  test('exists', async () => {
    axios.get.mockResolvedValue(dashboardResponse);

    const wrapper = shallowMount(Dashboard, {
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(Dashboard)
    expect(el.exists()).to.be.true
  })

})

import axios from 'axios'
import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import Dashboard from '@/views/company/Dashboard.vue'
import dashboardResponse from '../../fixtures/dashboard'

jest.mock('axios')


describe('Dashboard.vue', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(dashboardResponse);

    const wrapper = shallowMount(Dashboard, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(Dashboard)
    expect(el.exists()).to.be.true
  })

})

import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import Settings from '@/views/company/Settings.vue'
import settingsResponse from '../../fixtures/settings'

jest.mock('axios')


describe('Settings.vue', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(settingsResponse);

    const wrapper = shallowMount(Settings, {
      localVue,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(Settings)
    expect(el.exists()).to.be.true
  })

})

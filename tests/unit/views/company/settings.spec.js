import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import Settings from '@/views/company/Settings.vue'
import settingsResponse from '../../fixtures/settings'

vi.mock('axios')

describe('Settings.vue', () => {
  test('exists', async () => {
    axios.get.mockResolvedValue(settingsResponse);

    const wrapper = shallowMount(Settings, {
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(Settings)
    expect(el.exists()).to.be.true
  })

})

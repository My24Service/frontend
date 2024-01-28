import axios from 'axios'
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Vuex from 'vuex'

import Info from '@/views/company/Info.vue'
import infoResponse from '../../fixtures/info'

vi.mock('axios')

describe('Info.vue', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getCountries: () => [],
    }

    store = new Vuex.Store({
      actions,
    })
  })

  test('exists', async () => {
    axios.get.mockResolvedValue(infoResponse);

    const wrapper = shallowMount(Info, {
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(Info)
    expect(el.exists()).to.be.true
  })

})

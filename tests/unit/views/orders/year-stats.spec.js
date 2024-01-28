import axios from "axios"
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Vuex from 'vuex';
const moment = require('moment')
import { describe, expect, vi, test } from 'vitest'

import YearStats from '@/views/orders/YearStats'
import yearResponse from '../../fixtures/year'

vi.mock('axios')


describe('YearStats.vue', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getStatuscodes: () => [],
      getOrderTypes: () => [],
    }

    store = new Vuex.Store({
      actions,
      state: {
        userInfo: {
          pk: 1,
          is_staff: true,
          customer_user: null
        }
      }
    })
  })

  test('exists', async () => {
    axios.get.mockResolvedValue(yearResponse);

    const wrapper = shallowMount(YearStats, {
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(YearStats)
    expect(el.exists()).to.be.true
  })
})

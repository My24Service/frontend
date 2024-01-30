import axios from "axios"
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Vuex from 'vuex';
const moment = require('moment')

import MonthStats from '@/views/orders/MonthStats'
import monthResponse from '../../fixtures/month'

vi.mock('axios')


describe('MonthStats.vue', () => {
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
    axios.get.mockResolvedValue(monthResponse);

    const wrapper = shallowMount(MonthStats, {
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(MonthStats)
    expect(el.exists()).to.be.true
  })
})

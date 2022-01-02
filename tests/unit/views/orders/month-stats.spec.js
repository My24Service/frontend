import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Vuex from 'vuex';
const moment = require('moment')

import localVue from '../../index'
import MonthStats from '@/views/orders/MonthStats'
import monthResponse from '../../fixtures/month'

jest.mock('axios')


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
    })
  })

  it('exists', async () => {
    axios.get.mockResolvedValueOnce(monthResponse);

    const wrapper = shallowMount(MonthStats, {
      localVue,
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

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(monthResponse);

    const wrapper = mount(MonthStats, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#month-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })
})

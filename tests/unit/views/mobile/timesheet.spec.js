import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import VueRouter from 'vue-router'
const moment = require('moment')

import localVue from '../../index'
import TimeSheet from '@/views/mobile/TimeSheet.vue'
import TimeSheetResponse from '../../fixtures/timesheet-totals'
import Vuex from "vuex";

jest.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'mobile-timesheet-detail'
},
]

const router = new VueRouter({routes})

describe('TimeSheet.vue', () => {
  let getters
  let store

  beforeEach(() => {
    getters = {
      getCurrentLanguage: () => 'nl',
    }

    store = new Vuex.Store({
      getters,
    })
  })

  it('has TimeSheet component', async () => {
    axios.get.mockResolvedValueOnce(TimeSheetResponse);

    const wrapper = shallowMount(TimeSheet, {
      localVue,
      router,
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(TimeSheet)
    expect(el.exists()).to.be.true
  })

  it('contains "Apple User"', async () => {
    axios.get.mockResolvedValueOnce(TimeSheetResponse);

    const wrapper = mount(TimeSheet, {
      localVue,
      router,
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Apple User')
  })

  it('has two materials rows', async () => {
    axios.get.mockResolvedValueOnce(TimeSheetResponse);

    const wrapper = mount(TimeSheet, {
      localVue,
      router,
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#timesheet-material-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

})

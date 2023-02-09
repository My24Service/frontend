import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
const moment = require('moment')

import localVue from '../../index'
import TimeSheetDetail from '@/views/mobile/TimeSheetDetail.vue'
import timesheetDetailResponse from '../../fixtures/timesheet-detail'
import Vuex from "vuex";
import VueRouter from "vue-router";

jest.mock('axios')

const routes = [
  {
    path: '/hello/world',
    name: 'mobile-timesheet-detail'
  },
]

const router = new VueRouter({routes})

describe('TimeSheetDetail.vue', () => {
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

  it('has TimeSheetDetail component', async () => {
    axios.get.mockResolvedValueOnce(timesheetDetailResponse);

    const wrapper = shallowMount(TimeSheetDetail, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(TimeSheetDetail)
    expect(el.exists()).to.be.true
  })

  it('contains "Apple User"', async () => {
    axios.get.mockResolvedValueOnce(timesheetDetailResponse);

    const wrapper = mount(TimeSheetDetail, {
      localVue,
      store,
      router,
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
    axios.get.mockResolvedValueOnce(timesheetDetailResponse);

    const wrapper = mount(TimeSheetDetail, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#timesheet-detail-material-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

})

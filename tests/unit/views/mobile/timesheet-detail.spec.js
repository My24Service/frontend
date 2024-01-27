import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
const moment = require('moment')

import TimeSheetDetail from '@/views/mobile/TimeSheetDetail.vue'
import timesheetDetailResponse from '../../fixtures/timesheet-detail'
import Vuex from "vuex";
import VueRouter from "vue-router";

vi.mock('axios')

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

  test('has TimeSheetDetail component', async () => {
    axios.get.mockResolvedValue(timesheetDetailResponse);

    const wrapper = shallowMount(TimeSheetDetail, {
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

  test('contains "Apple User"', async () => {
    axios.get.mockResolvedValue(timesheetDetailResponse);

    const wrapper = mount(TimeSheetDetail, {
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

  test('has two materials rows', async () => {
    axios.get.mockResolvedValue(timesheetDetailResponse);

    const wrapper = mount(TimeSheetDetail, {
      store,
      router,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#timesheet-detail-material-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

})

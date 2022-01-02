import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Vuex from 'vuex';
const moment = require('moment')

import localVue from '../../index'
import TimeSheetDetail from '@/views/mobile/TimeSheetDetail.vue'
import timesheetDetailResponse from '../../fixtures/timesheet-detail'

jest.mock('axios')

describe('TimeSheetDetail.vue maintenance', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getMemberType: () => 'maintenance',
    }

    store = new Vuex.Store({
      actions,
    })
  })

  it('has TimeSheetDetail component', async () => {
    axios.get.mockResolvedValueOnce(timesheetDetailResponse);

    const wrapper = shallowMount(TimeSheetDetail, {
      localVue,
      store,
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
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Apple User')
  })

  it('does not contain "trips"', async () => {
    axios.get.mockResolvedValueOnce(timesheetDetailResponse);

    const wrapper = mount(TimeSheetDetail, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('trips')
  })

  it('has two materials rows', async () => {
    axios.get.mockResolvedValueOnce(timesheetDetailResponse);

    const wrapper = mount(TimeSheetDetail, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#timehseet-detail-material-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

})


describe('TimeSheetDetail.vue temps', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getMemberType: () => 'temps',
    }

    store = new Vuex.Store({
      actions,
    })
  })

  it('has TimeSheetDetail component', async () => {
    axios.get.mockResolvedValueOnce(timesheetDetailResponse);

    const wrapper = shallowMount(TimeSheetDetail, {
      localVue,
      store,
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
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Apple User')
  })

  it('contains "trips"', async () => {
    axios.get.mockResolvedValueOnce(timesheetDetailResponse);

    const wrapper = mount(TimeSheetDetail, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('trips')
  })

  it('has two materials rows', async () => {
    axios.get.mockResolvedValueOnce(timesheetDetailResponse);

    const wrapper = mount(TimeSheetDetail, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#timehseet-detail-material-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })
})


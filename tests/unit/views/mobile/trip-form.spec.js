import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
const moment = require('moment')
import Vuex from "vuex"

import localVue from '../../index'
import TripForm from '@/views/mobile/TripForm.vue'
import tripResponse from '../../fixtures/trip'

jest.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/mobile/trip/1/':
      return Promise.resolve(tripResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('TripForm.vue', () => {
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

  it('exists', async () => {
    const wrapper = shallowMount(TripForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
      store,
    })

    await flushPromises()

    const el = wrapper.findComponent(TripForm)
    expect(el.exists()).to.be.true
  })

  it('insert, contains "New trip"', async () => {
    const wrapper = mount(TripForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
      store,
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New trip</h2>')
  })

  it('edit, contains "Edit trip"', async () => {
    const wrapper = mount(TripForm, {
      localVue,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
      propsData: {
        pk: 1
      },
      store,
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>Edit trip</h2>')
  })
})

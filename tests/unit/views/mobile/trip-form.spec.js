import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
const moment = require('moment')
import Vuex from "vuex"

import TripForm from '@/views/mobile/TripForm.vue'
import tripResponse from '../../fixtures/trip'

vi.mock('axios')

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

  test('exists', async () => {
    const wrapper = shallowMount(TripForm, {
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

  test('insert, contains "New trip"', async () => {
    const wrapper = mount(TripForm, {
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

  test('edit, contains "Edit trip"', async () => {
    const wrapper = mount(TripForm, {
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

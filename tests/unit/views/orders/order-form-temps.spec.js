import axios from "axios"
import { shallowMount, mount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import Vuex from 'vuex'
import flushPromises from 'flush-promises'
const moment = require('moment')
import { describe, expect, vi, test } from 'vitest'

import OrderFormTemps from '@/views/orders/OrderFormTemps.vue'
import orderResponse from '../../fixtures/order'

vi.mock('axios')
axios.get.mockImplementation((url) => {
  switch (url) {
    case '/order/order/1/':
      return Promise.resolve(orderResponse)
    case '/customer/customer/autocomplete/?q=':
      return Promise.resolve({data: []})
    default:
      console.log(url)
      return Promise.reject(new Error('not found'))
  }
})


describe('OrderFormTemps.vue temps', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getCountries: () => [],
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
    const wrapper = mount(OrderFormTemps, {
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
      stubs: ['multiselect', 'OrderTypesSelect']
    })

    await flushPromises()

    let el

    el = wrapper.findComponent(OrderFormTemps)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "New order"', async () => {
    const wrapper = mount(OrderFormTemps, {
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
      stubs: ['multiselect', 'OrderTypesSelect']
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('New order')
  })

  test('edit, contains "Edit order"', async () => {
    const wrapper = mount(OrderFormTemps, {
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
      propsData: {
        pk: 1
      },
      stubs: ['multiselect', 'OrderTypesSelect']
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Edit order')
  })

  test('contains "Required users"', async () => {
    const wrapper = mount(OrderFormTemps, {
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Required users')
  })

})

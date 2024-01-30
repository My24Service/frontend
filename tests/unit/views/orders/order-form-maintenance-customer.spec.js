import axios from "axios"
import { mount } from '@vue/test-utils'
import Vuex from 'vuex'
import flushPromises from 'flush-promises'
const moment = require('moment')
import { describe, expect, vi, test } from 'vitest'

import OrderFormMaintenanceCustomer from '@/views/orders/OrderFormMaintenanceCustomer.vue'
import orderResponse from '../../fixtures/order'
import customerResponse from '../../fixtures/customer';

vi.mock('axios')

const userResponse = {
  user: {
    customer_user: {
      customer: 1
    }
  }
}

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/customer/customer/1/':
      return Promise.resolve(customerResponse)
    case '/company/user-info-me/':
      return Promise.resolve({data: userResponse})
    case '/order/order/1/':
      return Promise.resolve(orderResponse)
    default:
      console.log(url)
      return Promise.reject(new Error('not found'))
  }
})


describe('OrderFormMaintenanceCustomer.vue temps', () => {
  let store
  let actions
  let getters

  beforeEach(() => {
    getters = {
      getCurrentLanguage: () => 'nl'
    }

    actions = {
      getCountries: () => [],
      getOrderTypes: () => [],
    }

    store = new Vuex.Store({
      actions,
      getters,
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
    const wrapper = mount(OrderFormMaintenanceCustomer, {
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
      stubs: ['multiselect', 'OrderTypesSelect']
    })

    await flushPromises()

    let el

    el = wrapper.findComponent(OrderFormMaintenanceCustomer)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "New order"', async () => {
    const wrapper = mount(OrderFormMaintenanceCustomer, {
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
    const wrapper = mount(OrderFormMaintenanceCustomer, {
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

  test('does not contain "Required users"', async () => {
    const wrapper = mount(OrderFormMaintenanceCustomer, {
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('Required users')
  })

})

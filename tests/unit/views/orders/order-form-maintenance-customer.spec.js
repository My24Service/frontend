import axios from "axios"
import { expect } from 'chai'
import { mount } from '@vue/test-utils'
import Vuex from 'vuex'
import flushPromises from 'flush-promises'
const moment = require('moment')

import localVue from '../../index'
import OrderFormMaintenanceCustomer from '@/views/orders/OrderFormMaintenanceCustomer.vue'
import orderResponse from '../../fixtures/order'
import customerResponse from '../../fixtures/customer';

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
    case '/company/user-info/1/':
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

  it('exists', async () => {
    const wrapper = mount(OrderFormMaintenanceCustomer, {
      localVue,
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

  it('insert, contains "New order"', async () => {
    const wrapper = mount(OrderFormMaintenanceCustomer, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
      stubs: ['multiselect', 'OrderTypesSelect']
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New order</h2>')
  })

  it('edit, contains "Edit order"', async () => {
    const wrapper = mount(OrderFormMaintenanceCustomer, {
      localVue,
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
    expect(html).to.contain('<h2>Edit order</h2>')
  })

  it('does not contain "Required users"', async () => {
    const wrapper = mount(OrderFormMaintenanceCustomer, {
      localVue,
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

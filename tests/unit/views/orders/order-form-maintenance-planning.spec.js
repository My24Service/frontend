import axios from "axios"
import { expect } from 'chai'
import { mount } from '@vue/test-utils'
import Vuex from 'vuex'
import flushPromises from 'flush-promises'
const moment = require('moment')

import localVue from '../../index'
import OrderFormMaintenancePlanning from '@/views/orders/OrderFormMaintenancePlanning.vue'
import orderResponse from '../../fixtures/order'
import engineersResponse from '../../fixtures/user-engineers.js'

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/company/engineer/?page=1':
      return Promise.resolve(engineersResponse)
    case '/order/order/1/':
      return Promise.resolve(orderResponse)
    case '/customer/customer/autocomplete/?q=':
      return Promise.resolve({data: []})
    default:
      console.log(url)
      return Promise.reject(new Error('not found'))
  }
})


describe('OrderFormMaintenance.vue temps', () => {
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

  it('exists', async () => {
    const wrapper = mount(OrderFormMaintenancePlanning, {
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

    el = wrapper.findComponent(OrderFormMaintenancePlanning)
    expect(el.exists()).to.be.true
  })

  it('insert, contains "New order"', async () => {
    const wrapper = mount(OrderFormMaintenancePlanning, {
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
    const wrapper = mount(OrderFormMaintenancePlanning, {
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
    const wrapper = mount(OrderFormMaintenancePlanning, {
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

import axios from "axios"
import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils';
import Vuex from 'vuex'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import OrderFormMaintenance from '@/views/orders/OrderFormMaintenance.vue'
import OrderFormMaintenancePlanning from '@/views/orders/OrderFormMaintenancePlanning.vue'
import OrderFormMaintenanceCustomer from '@/views/orders/OrderFormMaintenanceCustomer.vue'
import customerResponse from '../../fixtures/customer.js'
import engineersResponse from '../../fixtures/user-engineers.js'

const userResponse = {
  user: {
    customer_user: {
      customer: 1
    }
  }
}

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/company/engineer/?page=1':
      return Promise.resolve(engineersResponse)
    case '/customer/customer/1/':
      return Promise.resolve(customerResponse)
    case '/company/user-info/1/':
      return Promise.resolve({data: userResponse})
    default:
      console.log(url)
      return Promise.reject(new Error('not found'))
  }
})

describe('OrderFormMaintenance staff', () => {
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

  it('has OrderFormMaintenancePlanning component', async () => {
    const wrapper = shallowMount(OrderFormMaintenance, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(OrderFormMaintenancePlanning)
    expect(el.exists()).to.be.true
  })

  it('does not have OrderFormMaintenanceCustomer component', async () => {
    const wrapper = shallowMount(OrderFormMaintenance, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(OrderFormMaintenanceCustomer)
    expect(el.exists()).not.to.be.true
  })
})

describe('OrderFormMaintenanceCustomer.vue maintenance', () => {
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
          is_staff: false,
          customer_user: 1
        }
      }
    })
  })

  it('has OrderFormMaintenanceCustomer component', async () => {
    const wrapper = shallowMount(OrderFormMaintenance, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(OrderFormMaintenanceCustomer)
    expect(el.exists()).to.be.true
  })

  it('does not have OrderFormMaintenancePlanning component', async () => {
    const wrapper = shallowMount(OrderFormMaintenance, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(OrderFormMaintenancePlanning)
    expect(el.exists()).not.to.be.true
  })
})

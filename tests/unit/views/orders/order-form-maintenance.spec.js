import axios from "axios"
import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils';
import Vuex from 'vuex'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import OrderFormMaintenance from '@/views/orders/OrderFormMaintenance.vue'
import OrderFormMaintenancePlanning from '@/views/orders/OrderFormMaintenancePlanning.vue'
import OrderFormMaintenanceCustomer from '@/views/orders/OrderFormMaintenanceCustomer.vue'
import OrderFormMaintenanceEmployee from '@/views/orders/OrderFormMaintenanceEmployee.vue'
import customerResponse from '../../fixtures/customer.js'
import engineersResponse from '../../fixtures/user-engineers.js'

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/company/engineer/?page=1':
      return Promise.resolve(engineersResponse)
    case '/customer/customer/1/':
      return Promise.resolve(customerResponse)
    default:
      console.log(url)
      return Promise.reject(new Error('not found'))
  }
})

describe('OrderFormMaintenance planning', () => {
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
          submodel: 'planning_user',
          user: {
            pk: 1,
            is_staff: false,
            planning_user: {}
          }
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

  it('does not have OrderFormMaintenanceEmployee component', async () => {
    const wrapper = shallowMount(OrderFormMaintenance, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(OrderFormMaintenanceEmployee)
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
          submodel: 'customer_user',
          user: {
            pk: 1,
            is_staff: false,
            customer_user: {
              customer: 1
            }
          }
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

describe('OrderFormMaintenanceEmployee.vue maintenance', () => {
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
          submodel: 'employee_user',
          user: {
            pk: 1,
            is_staff: false,
            employee_user: {
              branch: 1
            }
          }
        }
      }
    })
  })

  it('has OrderFormMaintenanceEmployee component', async () => {
    const wrapper = shallowMount(OrderFormMaintenance, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(OrderFormMaintenanceEmployee)
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

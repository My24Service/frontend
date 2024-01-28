import axios from "axios"
import { mount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import OrderForm from '@/views/orders/OrderForm.vue'
import OrderFormMaintenance from '@/views/orders/OrderFormMaintenance.vue'
import OrderFormTemps from '@/views/orders/OrderFormTemps.vue'
import orderResponse from '../../fixtures/orders'
import engineersResponse from '../../fixtures/user-engineers';
import customerResponse from '../../fixtures/customer';

vi.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'order-view'
},
]

const router = new VueRouter({routes})

const userResponse = {
  user: {
    customer_user: {
      customer: 1
    }
  }
}

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/customer/customer/autocomplete/?q=':
      return Promise.resolve({data:[]})
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

describe('OrderForm.vue temps', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getCountries: () => [],
      getOrderTypes: () => [],
      getMemberType: () => 'temps'
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

  test('has OrderFormTemps component', async () => {
    const wrapper = mount(OrderForm, {
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
      stubs: ['multiselect']
    })

    await flushPromises()

    let el

    el = wrapper.findComponent(OrderFormTemps)
    expect(el.exists()).to.be.true

    el = wrapper.findComponent(OrderFormMaintenance)
    expect(el.exists()).not.to.be.true
  })
})

describe('OrderForm.vue maintenance', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getCountries: () => [],
      getOrderTypes: () => [],
      getMemberType: () => 'maintenance'
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

  test('has OrderFormMaintenance component', async () => {
    const wrapper = mount(OrderForm, {
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
      stubs: ['multiselect']
    })

    await flushPromises()

    let el

    el = wrapper.findComponent(OrderFormMaintenance)
    expect(el.exists()).to.be.true

    el = wrapper.findComponent(OrderFormTemps)
    expect(el.exists()).not.to.be.true
  })

})

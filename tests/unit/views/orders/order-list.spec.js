import axios from "axios"
import { expect } from 'chai'
import { mount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import OrderList from '@/views/orders/OrderList.vue'
import OrderListMaintenance from '@/views/orders/OrderListMaintenance.vue'
import OrderListTemps from '@/views/orders/OrderListTemps.vue'
import ordersResponse from '../../fixtures/orders'

jest.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/order/order/?page=1':
      return Promise.resolve(ordersResponse)
    case '/order/order/all_for_customer_not_accepted_count/':
      return Promise.resolve({count: 1})
    default:
      console.error(`${url} not found`)
      return Promise.reject(new Error(`${url} not found`))
  }
})

const routes = [
{
  path: '/hello/world',
  name: 'order-view'
},
{
  path: '/hello/world',
  name: 'order-add'
},
{
  path: '/hello/world',
  name: 'order-edit'
},
{
  path: '/hello/world',
  name: 'order-documents'
},
]

const router = new VueRouter({routes})

describe('OrderList.vue temps', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getStatuscodes: () => [],
      getMemberType: () => 'temps',
      setUnacceptedCount: () => null,
      getAssignOrders: () => {}
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

  it('has OrderListTemps component', async () => {
    axios.get.mockResolvedValueOnce(ordersResponse);

    const wrapper = mount(OrderList, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    let el

    el = wrapper.findComponent(OrderListTemps)
    expect(el.exists()).to.be.true

    el = wrapper.findComponent(OrderListMaintenance)
    expect(el.exists()).not.to.be.true
  })
})

describe('OrderList.vue maintenance', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getStatuscodes: () => [],
      getMemberType: () => 'maintenance',
      setUnacceptedCount: () => null,
      getAssignOrders: () => {},
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

  it('has OrderListMaintenance component', async () => {
    axios.get.mockResolvedValueOnce(ordersResponse);

    const wrapper = mount(OrderList, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    let el

    el = wrapper.findComponent(OrderListMaintenance)
    expect(el.exists()).to.be.true

    el = wrapper.findComponent(OrderListTemps)
    expect(el.exists()).not.to.be.true
  })

})

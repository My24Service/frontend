import axios from "axios"
import { expect } from 'chai'
import { mount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import OrderListNotAccepted from '@/views/orders/OrderListNotAccepted.vue'
import ordersResponse from '../../fixtures/orders'

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

jest.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/order/order/all_for_customer_not_accepted/?page=1':
      return Promise.resolve(ordersResponse)
    case '/order/order/all_for_customer_not_accepted_count/':
      return Promise.resolve({count: 1})
    default:
      console.error(`${url} not found`)
      return Promise.reject(new Error(`${url} not found`))
  }
})

describe('OrderListNotAccepted.vue', () => {
  let mock
  let store
  let actions

  beforeEach(() => {
    actions = {
      getStatuscodes: () => [],
      getMemberType: () => 'maintenance',
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

  it('exists', async () => {
    axios.get.mockResolvedValueOnce(ordersResponse);

    const wrapper = mount(OrderListNotAccepted, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(OrderListNotAccepted)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(ordersResponse);

    const wrapper = mount(OrderListNotAccepted, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    // console.log(wrapper.html())
    const trs = wrapper.findAll('#order-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })
})

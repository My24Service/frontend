import axios from "axios"
import { mount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'
import { describe, expect, vi, test } from 'vitest'

import OrderListMaintenance from '@/views/orders/OrderListMaintenance.vue'
import ordersResponse from '../../fixtures/orders'

vi.mock('axios')

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


describe('OrderListMaintenance.vue', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getStatuscodes: () => [],
      getMemberType: () => 'maintenance',
      setUnacceptedCount: () => 1,
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

  test('exists', async () => {
    axios.get.mockResolvedValue(ordersResponse);

    const wrapper = mount(OrderListMaintenance, {
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(OrderListMaintenance)
    expect(el.exists()).to.be.true
  })

  test('contains order-list-maintenance ref', async () => {
    axios.get.mockResolvedValue(ordersResponse);

    const wrapper = mount(OrderListMaintenance, {
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent({ ref: 'order-list-maintenance' })
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(ordersResponse);

    const wrapper = mount(OrderListMaintenance, {
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAllComponents('#order-table > tbody > tr.order-row')
    expect(trs.length).toBe(2)
  })

  test('does not contain "Required users"', async () => {
    axios.get.mockResolvedValue(ordersResponse);

    const wrapper = mount(OrderListMaintenance, {
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('Required users')
  })

  test('not dispatch: contains title="Documents"', async () => {
    axios.get.mockResolvedValue(ordersResponse);

    const wrapper = mount(OrderListMaintenance, {
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('title="Documents"')
  })
})

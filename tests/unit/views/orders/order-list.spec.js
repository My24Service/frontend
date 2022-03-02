import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import OrderList from '@/views/orders/OrderList.vue'
import OrderListMaintenance from '@/views/orders/OrderListMaintenance.vue'
import OrderListTemps from '@/views/orders/OrderListTemps.vue'
import ordersResponse from '../../fixtures/orders'

jest.mock('axios')

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

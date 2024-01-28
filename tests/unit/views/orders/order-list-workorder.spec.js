import axios from "axios"
import { shallowMount, mount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'
import { describe, expect, vi, test } from 'vitest'

import OrderListWorkorder from '@/views/orders/OrderListWorkorder.vue'
import ordersResponse from '../../fixtures/orders'

vi.mock('axios')

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


describe('OrderListWorkorder.vue', () => {
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

  test('exists', async () => {
    axios.get.mockResolvedValue(ordersResponse);

    const wrapper = mount(OrderListWorkorder, {
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(OrderListWorkorder)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(ordersResponse);

    const wrapper = mount(OrderListWorkorder, {
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

    const wrapper = mount(OrderListWorkorder, {
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
})

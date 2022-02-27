import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import OrderListSales from '@/views/orders/OrderListSales.vue'
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


describe('OrderListSales.vue', () => {
  let mock
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

  it('exists', async () => {
    axios.get.mockResolvedValueOnce(ordersResponse);

    const wrapper = shallowMount(OrderListSales, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(OrderListSales)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(ordersResponse);

    const wrapper = mount(OrderListSales, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#order-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('does not contain "Required users"', async () => {
    axios.get.mockResolvedValueOnce(ordersResponse);

    const wrapper = mount(OrderListSales, {
      localVue,
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

  it('does not contain title="Documents"', async () => {
    axios.get.mockResolvedValueOnce(ordersResponse);

    const wrapper = mount(OrderListSales, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('title="Documents"')
  })
})

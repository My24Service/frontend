import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import OrderListPast from '@/views/orders/OrderListPast.vue'
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


describe('OrderListPast.vue', () => {
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
    })
  })

  it('exists', async () => {
    axios.get.mockResolvedValueOnce(ordersResponse);

    const wrapper = shallowMount(OrderListPast, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(OrderListPast)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(ordersResponse);

    const wrapper = mount(OrderListPast, {
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

    const wrapper = mount(OrderListPast, {
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

    const wrapper = mount(OrderListPast, {
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

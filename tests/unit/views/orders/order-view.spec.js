import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import OrderView from '@/views/orders/OrderView.vue'
import OrderViewMaintenance from '@/views/orders/OrderViewMaintenance.vue'
import OrderViewTemps from '@/views/orders/OrderViewTemps.vue'
import orderResponse from '../../fixtures/order'

jest.mock('axios')

const routes = [
]

const router = new VueRouter({routes})

describe('OrderView.vue temps', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getStatuscodes: () => [],
      getMemberType: () => 'temps'
    }

    store = new Vuex.Store({
      actions,
    })
  })

  it('has OrderViewTemps component', async () => {
    axios.get.mockResolvedValueOnce(orderResponse);

    const wrapper = shallowMount(OrderView, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(OrderViewTemps)
    expect(el.exists()).to.be.true
  })

  it('does not have OrderViewMaintenance component', async () => {
    axios.get.mockResolvedValueOnce(orderResponse);

    const wrapper = shallowMount(OrderView, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(OrderViewMaintenance)
    expect(el.exists()).not.to.be.true
  })
})

describe('OrderView.vue maintenance', () => {
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

  it('has OrderViewMaintenance component', async () => {
    axios.get.mockResolvedValueOnce(orderResponse);

    const wrapper = shallowMount(OrderView, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(OrderViewMaintenance)
    expect(el.exists()).to.be.true
  })

  it('does not have OrderViewTemps component', async () => {
    axios.get.mockResolvedValueOnce(orderResponse);

    const wrapper = shallowMount(OrderView, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(OrderViewTemps)
    expect(el.exists()).not.to.be.true
  })

})

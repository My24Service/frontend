import axios from "axios"
import { shallowMount, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'
import { describe, expect, vi, test } from 'vitest'

import OrderView from '@/views/orders/OrderView.vue'
import OrderViewMaintenance from '@/views/orders/OrderViewMaintenance.vue'
import OrderViewTemps from '@/views/orders/OrderViewTemps.vue'
import orderResponse from '../../fixtures/order'

vi.mock('axios')

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
      state: {
        userInfo: {
          pk: 1,
          is_staff: true,
          customer_user: null
        }
      }
    })
  })

  test('has OrderViewTemps component', async () => {
    axios.get.mockResolvedValue(orderResponse);

    const wrapper = shallowMount(OrderView, {
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

  test('does not have OrderViewMaintenance component', async () => {
    axios.get.mockResolvedValue(orderResponse);

    const wrapper = shallowMount(OrderView, {
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

  test('has OrderViewMaintenance component', async () => {
    axios.get.mockResolvedValue(orderResponse);

    const wrapper = shallowMount(OrderView, {
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

  test('does not have OrderViewTemps component', async () => {
    axios.get.mockResolvedValue(orderResponse);

    const wrapper = shallowMount(OrderView, {
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

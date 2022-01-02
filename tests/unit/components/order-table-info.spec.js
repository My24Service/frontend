import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../index'
import OrderTableInfo from '@/components/OrderTableInfo.vue'
import orderResponse from '../fixtures/order'

const routes = [{
  path: '/hello/world',
  name: 'order-view'
}]

const router = new VueRouter({routes})

describe('OrderTableInfo.vue temps', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getMemberType: () => 'temps'
    }

    store = new Vuex.Store({
      actions
    })
  })

  it('exists', () => {
    const wrapper = shallowMount(OrderTableInfo, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        order: orderResponse.data
      }
    })

    const el = wrapper.findComponent(OrderTableInfo)
    expect(el.exists()).to.be.true
  })

  it('has "Required users"', async () => {
    const wrapper = shallowMount(OrderTableInfo, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        order: orderResponse.data
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Required users')
  })
})

describe('OrderTableInfo.vue maintenance', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getMemberType: () => 'maintenance'
    }

    store = new Vuex.Store({
      actions
    })
  })

  it('exists', () => {
    const wrapper = shallowMount(OrderTableInfo, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        order: orderResponse.data
      }
    })

    const el = wrapper.findComponent(OrderTableInfo)
    expect(el.exists()).to.be.true
  })

  it('does not have "Required users"', async () => {
    const wrapper = shallowMount(OrderTableInfo, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        order: orderResponse.data
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).not.to.contain('Required users')
  })
})

import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import OrderForm from '@/views/orders/OrderForm.vue'
import OrderFormMaintenance from '@/views/orders/OrderFormMaintenance.vue'
import OrderFormTemps from '@/views/orders/OrderFormTemps.vue'
import orderResponse from '../../fixtures/orders'

jest.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'order-view'
},
]

const router = new VueRouter({routes})

describe('OrderForm.vue temps', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getCountries: () => [],
      getOrderTypes: () => [],
      getMemberType: () => 'temps'
    }

    store = new Vuex.Store({
      actions,
    })
  })

  it('has OrderFormTemps component', async () => {
    axios.get.mockResolvedValueOnce(orderResponse);

    const wrapper = mount(OrderForm, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
      stubs: ['multiselect']
    })

    await flushPromises()

    let el

    el = wrapper.findComponent(OrderFormTemps)
    expect(el.exists()).to.be.true

    el = wrapper.findComponent(OrderFormMaintenance)
    expect(el.exists()).not.to.be.true
  })
})

describe('OrderForm.vue maintenance', () => {
  let store
  let actions

  beforeEach(() => {
    actions = {
      getCountries: () => [],
      getOrderTypes: () => [],
      getMemberType: () => 'maintenance'
    }

    store = new Vuex.Store({
      actions,
    })
  })

  it('has OrderFormMaintenance component', async () => {
    axios.get.mockResolvedValueOnce(orderResponse);

    const wrapper = mount(OrderForm, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
      stubs: ['multiselect']
    })

    await flushPromises()

    let el

    el = wrapper.findComponent(OrderFormMaintenance)
    expect(el.exists()).to.be.true

    el = wrapper.findComponent(OrderFormTemps)
    expect(el.exists()).not.to.be.true
  })

})

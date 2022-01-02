import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import OrderViewMaintenance from '@/views/orders/OrderViewMaintenance.vue'
import orderResponse from '../../fixtures/order'

jest.mock('axios')

const routes = [
]

const router = new VueRouter({routes})

describe('OrderMaintenanceView.vue', () => {
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

    const wrapper = shallowMount(OrderViewMaintenance, {
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

  it('has 2 orderline rows', async () => {
    axios.get.mockResolvedValueOnce(orderResponse);

    const wrapper = mount(OrderViewMaintenance, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#orderline-table tbody tr')
    expect(trs.length).to.equal(2)
  })

  it('does not contain "Required users"', async () => {
    axios.get.mockResolvedValueOnce(orderResponse);

    const wrapper = mount(OrderViewMaintenance, {
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

  it('has recreateWorkorderPdfButton when not past', async () => {
    axios.get.mockResolvedValueOnce(orderResponse);

    const wrapper = mount(OrderViewMaintenance, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const button = wrapper.find('#recreateWorkorderPdfButton')
    expect(button.exists()).to.be.true
  })

  it('does not have recreateWorkorderPdfButton when past', async () => {
    axios.get.mockResolvedValueOnce(orderResponse);

    const wrapper = mount(OrderViewMaintenance, {
      localVue,
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        past: true
      }
    })

    await flushPromises()

    const button = wrapper.find('#recreateWorkorderPdfButton')
    expect(button.exists()).not.to.be.true
  })
})


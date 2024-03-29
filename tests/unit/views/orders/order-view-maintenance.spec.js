import axios from "axios"
import { shallowMount, mount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'
import { describe, expect, vi, test } from 'vitest'

import OrderViewMaintenance from '@/views/orders/OrderViewMaintenance.vue'
import orderResponse from '../../fixtures/order'

vi.mock('axios')

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
      state: {
        userInfo: {
          pk: 1,
          is_staff: true,
          customer_user: null
        }
      }
    })
  })

  test('has OrderViewMaintenance component', async () => {
    axios.get.mockResolvedValue(orderResponse);

    const wrapper = shallowMount(OrderViewMaintenance, {
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

  test('has 2 orderline rows', async () => {
    axios.get.mockResolvedValue(orderResponse);

    const wrapper = mount(OrderViewMaintenance, {
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#orderline-table tbody tr')
    expect(trs.length).toBe(2)
  })

  test('does not contain "Required users"', async () => {
    axios.get.mockResolvedValue(orderResponse);

    const wrapper = mount(OrderViewMaintenance, {
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

  test('has recreateWorkorderPdfButton when not past', async () => {
    axios.get.mockResolvedValue(orderResponse);

    const wrapper = mount(OrderViewMaintenance, {
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const button = wrapper.find('#recreateWorkorderPdfButtonGotenberg')
    expect(button.exists()).to.be.true
  })

  test('does not have recreateWorkorderPdfButton when past', async () => {
    axios.get.mockResolvedValue(orderResponse);

    const wrapper = mount(OrderViewMaintenance, {
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

    const button = wrapper.find('#recreateWorkorderPdfButtonGotenberg')
    expect(button.exists()).not.to.be.true
  })
})

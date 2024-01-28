import axios from "axios"
import { shallowMount, mount } from '@vue/test-utils'
import { render } from '@vue/server-test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'
import { describe, expect, vi, test } from 'vitest'

import OrderViewTemps from '@/views/orders/OrderViewTemps.vue'
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

    const wrapper = shallowMount(OrderViewTemps, {
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

  test('has 2 orderline rows', async () => {
    axios.get.mockResolvedValue(orderResponse);

    const wrapper = mount(OrderViewTemps, {
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

  test('contains "Required users"', async () => {
    axios.get.mockResolvedValue(orderResponse);

    const wrapper = mount(OrderViewTemps, {
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Required users')
  })

  test('does not have recreateWorkorderPdf button', async () => {
    axios.get.mockResolvedValue(orderResponse);

    const wrapper = mount(OrderViewTemps, {
      store,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const button = wrapper.find('#recreateWorkorderPdfButton')
    expect(button.exists()).not.to.be.true
  })
})


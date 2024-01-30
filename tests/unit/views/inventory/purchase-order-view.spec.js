import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import PurchaseOrderView from '@/views/inventory/PurchaseOrderView.vue'
import purchaseOrderResponse from '../../fixtures/purchaseorder'

vi.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/inventory/purchaseorder/1/':
      return Promise.resolve(purchaseOrderResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})

const routes = [
]

const router = new VueRouter({routes})

describe('PurchaseOrderView.vue', () => {
  test('has PurchaseOrderView component', async () => {
    const wrapper = shallowMount(PurchaseOrderView, {
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        pk: 1
      }
    })

    await flushPromises()

    const el = wrapper.findComponent(PurchaseOrderView)
    expect(el.exists()).to.be.true
  })

  test('has 3 material rows', async () => {
    const wrapper = mount(PurchaseOrderView, {
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        pk: 1
      }
    })

    await flushPromises()

    const trs = wrapper.findAll('#purchaseorder-materials-table tbody tr')
    expect(trs.length).toBe(3)
  })

  test('has 1 entry row', async () => {
    const wrapper = mount(PurchaseOrderView, {
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        pk: 1
      }
    })

    await flushPromises()

    const trs = wrapper.findAll('#purchaseorder-entries-table tbody tr')
    expect(trs.length).toBe(1)
  })

  test('contains "Limoen Likeur"', async () => {
    const wrapper = mount(PurchaseOrderView, {
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        pk: 1
      }
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Limoen Likeur')
  })
})

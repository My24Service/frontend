import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import PurchaseOrderView from '@/views/inventory/PurchaseOrderView.vue'
import purchaseOrderResponse from '../../fixtures/purchaseorder'

jest.mock('axios')

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
  it('has PurchaseOrderView component', async () => {
    const wrapper = shallowMount(PurchaseOrderView, {
      localVue,
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

  it('has 3 material rows', async () => {
    const wrapper = mount(PurchaseOrderView, {
      localVue,
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
    expect(trs.length).to.equal(3)
  })

  it('has 1 entry row', async () => {
    const wrapper = mount(PurchaseOrderView, {
      localVue,
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
    expect(trs.length).to.equal(1)
  })

  it('contains "Limoen Likeur"', async () => {
    const wrapper = mount(PurchaseOrderView, {
      localVue,
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

import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import StockLocationView from '@/views/inventory/StockLocationView.vue'
import stockLocationResponse from '../../fixtures/stocklocation'
import locationMaterialsResponse from '../../fixtures/materials-for-location'

jest.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/inventory/stock-location/1/':
      return Promise.resolve(stockLocationResponse)
    case '/inventory/inventory-materials-for-location/?location=1&q=':
      return Promise.resolve(locationMaterialsResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})

const routes = [
]

const router = new VueRouter({routes})

describe('StockLocationView.vue', () => {
  it('has StockLocationView component', async () => {
    const wrapper = shallowMount(StockLocationView, {
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

    const el = wrapper.findComponent(StockLocationView)
    expect(el.exists()).to.be.true
  })

  it('has 2 material rows', async () => {
    const wrapper = mount(StockLocationView, {
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

    const trs = wrapper.findAll('#location-materials-table tbody tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "Centraal magazijn"', async () => {
    const wrapper = mount(StockLocationView, {
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
    expect(html).to.contain('Centraal magazijn')
  })
})


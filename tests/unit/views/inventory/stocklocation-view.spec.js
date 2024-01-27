import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import StockLocationView from '@/views/inventory/StockLocationView.vue'
import stockLocationResponse from '../../fixtures/stocklocation'
import locationMaterialsResponse from '../../fixtures/materials-for-location'

vi.mock('axios')

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
  test('has StockLocationView component', async () => {
    const wrapper = shallowMount(StockLocationView, {
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

  test('has 2 material rows', async () => {
    const wrapper = mount(StockLocationView, {
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
    expect(trs.length).toBe(2)
  })

  test('contains "Centraal magazijn"', async () => {
    const wrapper = mount(StockLocationView, {
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


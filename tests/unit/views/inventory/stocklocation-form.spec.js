import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import StockLocationForm from '@/views/inventory/StockLocationForm.vue'
import stockLocationResponse from '../../fixtures/stocklocation'

vi.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/inventory/stock-location/1/':
      return Promise.resolve(stockLocationResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('StockLocationForm.vue', () => {
  test('exists', async () => {
    const wrapper = shallowMount(StockLocationForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(StockLocationForm)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "New stock location"', async () => {
    const wrapper = mount(StockLocationForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New stock location</h2>')
  })

  test('edit, contains "Edit stock location"', async () => {
    const wrapper = mount(StockLocationForm, {
      mocks: {
        $trans: (f) => f,
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>Edit stock location</h2>')
  })
})

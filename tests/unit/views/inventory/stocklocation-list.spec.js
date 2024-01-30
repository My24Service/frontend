import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import StockLocationList from '@/views/inventory/StockLocationList.vue'
import stockLocationResponse from '../../fixtures/stocklocations'

vi.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'stock-location-add'
},
{
  path: '/hello/world',
  name: 'stock-location-edit'
},
{
  path: '/hello/world',
  name: 'stock-location-view'
},
]

const router = new VueRouter({routes})


describe('StockLocationList.vue', () => {
  test('exists', async () => {
    axios.get.mockResolvedValue(stockLocationResponse);

    const wrapper = shallowMount(StockLocationList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(StockLocationList)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(stockLocationResponse);

    const wrapper = mount(StockLocationList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#stock-location-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

  test('contains "Breuken" and "Centraal magazijn"', async () => {
    axios.get.mockResolvedValue(stockLocationResponse);

    const wrapper = mount(StockLocationList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Centraal magazijn')
    expect(html).to.contain('Breuken')
  })
})

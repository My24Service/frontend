import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import StockLocationList from '@/views/inventory/StockLocationList.vue'
import stockLocationResponse from '../../fixtures/stocklocations'

jest.mock('axios')

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
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(stockLocationResponse);

    const wrapper = shallowMount(StockLocationList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(StockLocationList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(stockLocationResponse);

    const wrapper = mount(StockLocationList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#stock-location-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "Breuken" and "Centraal magazijn"', async () => {
    axios.get.mockResolvedValueOnce(stockLocationResponse);

    const wrapper = mount(StockLocationList, {
      localVue,
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

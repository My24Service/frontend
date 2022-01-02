import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import PurchaseOrderList from '@/views/inventory/PurchaseOrderList.vue'
import purchaseOrdersResponse from '../../fixtures/purchaseorders'

jest.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'purchaseorder-add'
},
{
  path: '/hello/world',
  name: 'purchaseorder-edit'
},
{
  path: '/hello/world',
  name: 'purchaseorder-view'
},
]

const router = new VueRouter({routes})


describe('PurchaseOrderList.vue', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(purchaseOrdersResponse);

    const wrapper = shallowMount(PurchaseOrderList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(PurchaseOrderList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(purchaseOrdersResponse);

    const wrapper = mount(PurchaseOrderList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#purchaseorder-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "999 Games" and "Princess"', async () => {
    axios.get.mockResolvedValueOnce(purchaseOrdersResponse);

    const wrapper = mount(PurchaseOrderList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Princess')
    expect(html).to.contain('999 Games')
  })
})

import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import PurchaseOrderList from '@/views/inventory/PurchaseOrderList.vue'
import purchaseOrdersResponse from '../../fixtures/purchaseorders'

vi.mock('axios')

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
  test('exists', async () => {
    axios.get.mockResolvedValue(purchaseOrdersResponse);

    const wrapper = shallowMount(PurchaseOrderList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(PurchaseOrderList)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(purchaseOrdersResponse);

    const wrapper = mount(PurchaseOrderList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#purchaseorder-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

  test('contains "999 Games" and "Princess"', async () => {
    axios.get.mockResolvedValue(purchaseOrdersResponse);

    const wrapper = mount(PurchaseOrderList, {
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

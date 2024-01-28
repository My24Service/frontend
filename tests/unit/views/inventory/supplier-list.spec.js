import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import SupplierList from '@/views/inventory/SupplierList.vue'
import supplierResponse from '../../fixtures/suppliers'

vi.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'supplier-add'
},
{
  path: '/hello/world',
  name: 'supplier-edit'
},
{
  path: '/hello/world',
  name: 'supplier-view'
},
]

const router = new VueRouter({routes})


describe('SupplierList.vue', () => {
  test('exists', async () => {
    axios.get.mockResolvedValue(supplierResponse);

    const wrapper = shallowMount(SupplierList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(SupplierList)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(supplierResponse);

    const wrapper = mount(SupplierList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#supplier-table > tbody > tr')
    expect(trs.length).toBe(2)
  })

  test('contains "Edisonstraat" and "Wormerweg"', async () => {
    axios.get.mockResolvedValue(supplierResponse);

    const wrapper = mount(SupplierList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Wormerweg')
    expect(html).to.contain('Edisonstraat')
  })
})

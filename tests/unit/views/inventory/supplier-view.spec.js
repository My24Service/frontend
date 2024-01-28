import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import SupplierView from '@/views/inventory/SupplierView.vue'
import supplierResponse from '../../fixtures/supplier'
import supplierMaterialsResponse from '../../fixtures/supplier-materials'

vi.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/inventory/supplier/1/':
      return Promise.resolve(supplierResponse)
    case '/inventory/material/?supplier_relation=1':
      return Promise.resolve(supplierMaterialsResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})

const routes = [
]

const router = new VueRouter({routes})

describe('SupplierView.vue', () => {
  test('has SupplierView component', async () => {
    const wrapper = shallowMount(SupplierView, {
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        pk: 1
      }
    })

    await flushPromises()

    const el = wrapper.findComponent(SupplierView)
    expect(el.exists()).to.be.true
  })

  test('has 2 material rows', async () => {
    const wrapper = mount(SupplierView, {
      router,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        pk: 1
      }
    })

    await flushPromises()

    const trs = wrapper.findAll('#materials-table tbody tr')
    expect(trs.length).toBe(2)
  })

  test('contains "20 second showdown" and "Bla bla laptop"', async () => {
    const wrapper = mount(SupplierView, {
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
    expect(html).to.contain('20 second showdown')
    expect(html).to.contain('Bla bla laptop')
  })
})


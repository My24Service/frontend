import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import SupplierView from '@/views/inventory/SupplierView.vue'
import supplierResponse from '../../fixtures/supplier'
import supplierMaterialsResponse from '../../fixtures/supplier-materials'

jest.mock('axios')

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
  it('has SupplierView component', async () => {
    const wrapper = shallowMount(SupplierView, {
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

    const el = wrapper.findComponent(SupplierView)
    expect(el.exists()).to.be.true
  })

  it('has 2 material rows', async () => {
    const wrapper = mount(SupplierView, {
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

    const trs = wrapper.findAll('#materials-table tbody tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "20 second showdown" and "Bla bla laptop"', async () => {
    const wrapper = mount(SupplierView, {
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
    expect(html).to.contain('20 second showdown')
    expect(html).to.contain('Bla bla laptop')
  })
})


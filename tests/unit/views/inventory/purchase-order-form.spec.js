import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Vuex from 'vuex';
const moment = require('moment')

import PurchaseOrderForm from '@/views/inventory/PurchaseOrderForm.vue'
import purchaseOrderResponse from '../../fixtures/purchaseorder'
import supplierResponse from '../../fixtures/supplier-autocomplete'
import materialResponse from '../../fixtures/material-autocomplete'

vi.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/inventory/purchaseorder/1/':
      return Promise.resolve(purchaseOrderResponse)
    case '/inventory/supplier/autocomplete/?q=':
      return Promise.resolve(supplierResponse)
    case '/inventory/material/autocomplete/?supplier=3&q=':
      return Promise.resolve(materialResponse)
    case '/inventory/material/autocomplete/?supplier=23&q=':
      return Promise.resolve(materialResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('PurchaseOrderForm.vue', () => {
  let actions
  let store

  beforeEach(() => {
    actions = {
      getCountries: () => []
    }

    store = new Vuex.Store({
      actions
    })
  })

  test('exists', async () => {
    const wrapper = shallowMount(PurchaseOrderForm, {
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(PurchaseOrderForm)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "New purchase order"', async () => {
    const wrapper = mount(PurchaseOrderForm, {
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New purchase order</h2>')
  })

  test('edit, contains "Edit purchase order"', async () => {
    const wrapper = mount(PurchaseOrderForm, {
      store,
      mocks: {
        $trans: (f) => f,
        $moment: moment,
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>Edit purchase order</h2>')
  })
})

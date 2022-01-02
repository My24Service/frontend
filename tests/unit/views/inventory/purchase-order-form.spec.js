import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Vuex from 'vuex';
const moment = require('moment')

import localVue from '../../index'
import PurchaseOrderForm from '@/views/inventory/PurchaseOrderForm.vue'
import purchaseOrderResponse from '../../fixtures/purchaseorder'

jest.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/inventory/purchaseorder/1/':
      return Promise.resolve(purchaseOrderResponse)
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

  it('exists', async () => {
    const wrapper = shallowMount(PurchaseOrderForm, {
      localVue,
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

  it('insert, contains "New purchase order"', async () => {
    const wrapper = mount(PurchaseOrderForm, {
      localVue,
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

  it('edit, contains "Edit purchase order"', async () => {
    const wrapper = mount(PurchaseOrderForm, {
      localVue,
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

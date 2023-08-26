import axios from "axios"
import { expect } from 'chai'
import { mount, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import InvoiceForm from '../../../../src/views/orders/InvoiceForm.vue'
import CallOutCosts from '../../../../src/views/orders/invoice_form/CallOutCosts'
import Distance from '../../../../src/views/orders/invoice_form/Distance'
import Materials from '../../../../src/views/orders/invoice_form/Materials'
import Hours from '../../../../src/views/orders/invoice_form/Hours'

import invoiceResponse from '../../fixtures/invoiceData'
import customerResponse from '../../fixtures/customer.js'
import {CustomerModel} from "../../../../src/models/customer/Customer";

jest.mock('axios')

const uuid = '6487254-2387'

axios.get.mockImplementation((url) => {
  switch (url) {
    case `/order/invoice/data/${uuid}/`:
      return Promise.resolve(invoiceResponse)
    case '/customer/customer/424/':
      return Promise.resolve(customerResponse)
    default:
      console.log(url)
      return Promise.reject(new Error('not found'))
  }
})

const getters = {
  getDefaultCurrency: () => 'EUR',
  getInvoiceDefaultVat: () => 21,
  getInvoiceDefaultMargin: () => 0,
  getInvoiceDefaultHourlyRate: () => '0.00',
  getVATTypes: () => [0, 9, 21],
}

describe('InvoiceForm', () => {
  let store

  beforeEach(() => {
    store = new Vuex.Store({
      getters,
    })
  })

  it('has 1 InvoiceForm component', async () => {
    const wrapper = mount(InvoiceForm, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        uuid
      }
    })

    await flushPromises()

    let el

    el = wrapper.findAllComponents(InvoiceForm)
    expect(el.exists()).to.be.true
    expect(el.length).to.equal(1)
  })

  it('has 1 CallOutCosts component', async () => {
    const wrapper = mount(InvoiceForm, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        uuid
      }
    })

    await flushPromises()

    let el

    el = wrapper.findAllComponents(CallOutCosts)
    expect(el.exists()).to.be.true
    expect(el.length).to.equal(1)
  })

  it('has 4 Hours components', async () => {
    const wrapper = mount(InvoiceForm, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        uuid
      }
    })

    await flushPromises()

    let el

    el = wrapper.findAllComponents(Hours)
    expect(el.exists()).to.be.true
    expect(el.length).to.equal(4)
  })

  it('has 1 Distance component', async () => {
    const wrapper = mount(InvoiceForm, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        uuid
      }
    })

    await flushPromises()

    let el

    el = wrapper.findAllComponents(Distance)
    expect(el.exists()).to.be.true
    expect(el.length).to.equal(1)
  })

  it('has 1 Materials component', async () => {
    const wrapper = mount(InvoiceForm, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        uuid
      }
    })

    await flushPromises()

    let el

    el = wrapper.findAllComponents(Materials)
    expect(el.exists()).to.be.true
    expect(el.length).to.equal(1)
  })
})

describe('CallOutCosts', () => {
  let store

  beforeEach(() => {
    store = new Vuex.Store({
      getters,
    })
  })

  it('has headers', async () => {
    const wrapper = shallowMount(CallOutCosts, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        invoice_default_call_out_costs: '0.00',
        customer: new CustomerModel(customerResponse.data)
      }
    })

    await flushPromises()

    const trs = wrapper.findAll('.header')
    expect(trs.length).to.equal(4)
  })

  it('has a total of €10.50', async () => {
    const wrapper = mount(CallOutCosts, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        invoice_default_call_out_costs: '10.50',
        customer: new CustomerModel(customerResponse.data)
      }
    })

    await flushPromises()

    const total_input = wrapper.find('input.total-input-final')
    expect(total_input.element.value).to.equal('€10.50')
  })
  //
})

describe('Distance', () => {
  let store

  beforeEach(() => {
    store = new Vuex.Store({
      getters,
    })
  })

  it('has headers', async () => {
    const wrapper = shallowMount(Distance, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        user_totals: invoiceResponse.data.activity_totals.user_totals,
        engineer_models: invoiceResponse.data.engineer_models,
        customer: new CustomerModel(customerResponse.data),
        distance_total: invoiceResponse.data.activity_totals.distance_total,
        invoice_default_price_per_km: '1.00'
      }
    })

    await flushPromises()

    const trs = wrapper.findAll('.header')
    expect(trs.length).to.equal(7)
  })

  it('has a total of €325.00', async () => {
    const wrapper = mount(Distance, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        user_totals: invoiceResponse.data.activity_totals.user_totals,
        engineer_models: invoiceResponse.data.engineer_models,
        customer: new CustomerModel(customerResponse.data),
        distance_total: invoiceResponse.data.activity_totals.distance_total,
        invoice_default_price_per_km: '1.00'
      }
    })

    await flushPromises()

    const total_input = wrapper.find('input.total-input-final')
    expect(total_input.element.value).to.equal('€325.00')
  })
  //

  it('has 3 distance_row rows', async () => {
    const wrapper = mount(Distance, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        user_totals: invoiceResponse.data.activity_totals.user_totals,
        engineer_models: invoiceResponse.data.engineer_models,
        customer: new CustomerModel(customerResponse.data),
        distance_total: invoiceResponse.data.activity_totals.distance_total,
        invoice_default_price_per_km: '1.00'
      }
    })

    await flushPromises()

    const els = wrapper.findAll('.distance_row')
    expect(els.length).to.equal(3)
  })
})

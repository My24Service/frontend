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
import HeaderCell from '../../../../src/views/orders/invoice_form/Header'

import invoiceResponse from '../../fixtures/invoiceData'
import customerResponse from '../../fixtures/customer.js'
import {CustomerModel} from "../../../../src/models/customer/Customer";
import {HOURS_TYPE_WORK} from "../../../../src/views/orders/invoice_form/constants";

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

  it('has 4 HeaderCells', async () => {
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

    const trs = wrapper.findAllComponents(HeaderCell)
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

  it('has 7 HeaderCells', async () => {
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

    const trs = wrapper.findAllComponents(HeaderCell)
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

    const els = wrapper.findAllComponents('.distance_row')
    expect(els.length).to.equal(3)
  })

  it('renders the total distance', async () => {
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

    const el = wrapper.find('.items-total')
    expect(el.html()).to.contain(invoiceResponse.data.activity_totals.distance_total)
  })

  it('renders a very big total distance and VAT', async () => {
    const digit = 1024 * 1024
    // const digit = 1024 * 1024 * 0.1 // ok
    // const digit = 1024 * 1024 * 0.01 // yields vat: expected '€823001.08' to include '823001.09'
    // const digit = 1024 * 1024 * 1.10001 // yields vat: expected '€90530942.69' to include '90530942.68'
    // const digit = 1024 * 1024 * 1.11 // yields vat: expected '€91353120.76' to include '91353120.77'
    // just to remember, it won't happen because distance is an int in the backend

    const total = invoiceResponse.data.activity_totals.user_totals.reduce(
      (total, m) => ( total + (m.distance_total * digit * 1.15 * 100)),
      0
    )

    const vat = invoiceResponse.data.activity_totals.user_totals.reduce(
      (total, m) => ( total + (m.distance_total * digit * 0.21 * 1.15 * 100)),
      0
    )

    const wrapper = mount(Distance, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        user_totals: invoiceResponse.data.activity_totals.user_totals.map((m) => ({
          ...m,
          distance_total: m.distance_total * digit
        })),
        engineer_models: invoiceResponse.data.engineer_models,
        customer: new CustomerModel(customerResponse.data),
        distance_total: invoiceResponse.data.activity_totals.distance_total * digit,
        invoice_default_price_per_km: '1.15'
      }
    })

    await flushPromises()

    const el = wrapper.find('.items-total')
    expect(el.html()).to.contain(invoiceResponse.data.activity_totals.distance_total * digit)

    const total_input = wrapper.find('input.total-input-final')
    expect(total_input.element.value).to.contain((total/100).toFixed(2))

    const vat_input = wrapper.find('input.vat-input-final')
    expect(vat_input.element.value).to.contain((vat/100).toFixed(2))
  })

})

describe('Materials', () => {
  let store

  beforeEach(() => {
    store = new Vuex.Store({
      getters,
    })
  })

  it('has 6 HeaderCells', async () => {
    const wrapper = shallowMount(Materials, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        material_models: invoiceResponse.data.material_models,
        used_materials: invoiceResponse.data.used_materials,
        customer: new CustomerModel(customerResponse.data)
      }
    })

    await flushPromises()

    const trs = wrapper.findAllComponents(HeaderCell)
    expect(trs.length).to.equal(6)
  })

  it('has a total of €20.50 and VAT €4.30', async () => {
    const wrapper = mount(Materials, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        material_models: invoiceResponse.data.material_models,
        used_materials: invoiceResponse.data.used_materials,
        customer: new CustomerModel(customerResponse.data)
      }
    })

    // 4x 947 a 1.25 = 5, vat 1.05
    // 4x 1001 a 0.75 = 3, vat 0.63
    // 50x 955 a 0.25 = 12.5, vat 2.63
    // total 20.5, vat 4.30

    // amount is DecimalField(decimal_places=2)

    await flushPromises()

    const total_input = wrapper.find('input.total-input-final')
    expect(total_input.element.value).to.equal('€20.50')

    const vat_input = wrapper.find('input.vat-input-final')
    expect(vat_input.element.value).to.contain("€4.30")
  })
  //
})

describe('Hours', () => {
  let store

  beforeEach(() => {
    store = new Vuex.Store({
      getters,
    })
  })

  it('has 6 HeaderCells', async () => {
    const wrapper = shallowMount(Hours, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        type: HOURS_TYPE_WORK,
        hours_total: invoiceResponse.data.activity_totals.work_total,
        user_totals: invoiceResponse.data.activity_totals.user_totals,
        engineer_models: invoiceResponse.data.engineer_models,
        customer: new CustomerModel(customerResponse.data)
      }
    })

    await flushPromises()

    const trs = wrapper.findAllComponents(HeaderCell)
    expect(trs.length).to.equal(5)
  })

  it('has a total of €230.00 and VAT €48.30', async () => {
    const wrapper = mount(Hours, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        type: HOURS_TYPE_WORK,
        hours_total: invoiceResponse.data.activity_totals.work_total,
        user_totals: invoiceResponse.data.activity_totals.user_totals,
        engineer_models: invoiceResponse.data.engineer_models,
        customer: new CustomerModel(customerResponse.data)
      }
    })

    await flushPromises()

    const total_input = wrapper.find('input.total-input-final')
    expect(total_input.element.value).to.equal('€230.00')

    const vat_input = wrapper.find('input.vat-input-final')
    expect(vat_input.element.value).to.contain("€48.30")
  })
  //
})

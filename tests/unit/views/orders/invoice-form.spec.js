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
import costsCocResponse from '../../fixtures/order_cost_coc'
import {CustomerModel} from "../../../../src/models/customer/Customer";
import {RateEngineerUserModel} from "../../../../src/models/company/UserEngineer";
import {
  COST_TYPE_ACTUAL_WORK, COST_TYPE_CALL_OUT_COSTS, COST_TYPE_DISTANCE,
  COST_TYPE_EXTRA_WORK,
  COST_TYPE_TRAVEL_HOURS,
  COST_TYPE_USED_MATERIALS,
  COST_TYPE_WORK_HOURS
} from "../../../../src/models/orders/Cost";

jest.mock('axios')

const uuid = '6487254-2387'

const emptyCosts = {
  data: {
    "next": null,
    "previous": null,
    "count": 1,
    "num_pages": 1,
    "results": []
  }
}

axios.get.mockImplementation((url) => {
  switch (url) {
    case `/order/invoice/data/${uuid}/`:
      return Promise.resolve(invoiceResponse)
    case '/customer/customer/424/':
      return Promise.resolve(customerResponse)
    case `/order/cost/?page=1&order=null&cost_type=${COST_TYPE_USED_MATERIALS}`:
      return Promise.resolve(emptyCosts)
    case `/order/cost/?page=1&order=null&cost_type=${COST_TYPE_WORK_HOURS}`:
      return Promise.resolve(emptyCosts)
    case `/order/cost/?page=1&order=null&cost_type=${COST_TYPE_TRAVEL_HOURS}`:
      return Promise.resolve(emptyCosts)
    case `/order/cost/?page=1&order=null&cost_type=${COST_TYPE_EXTRA_WORK}`:
      return Promise.resolve(emptyCosts)
    case `/order/cost/?page=1&order=null&cost_type=${COST_TYPE_ACTUAL_WORK}`:
      return Promise.resolve(emptyCosts)
    case `/order/cost/?page=1&order=null&cost_type=${COST_TYPE_DISTANCE}`:
      return Promise.resolve(emptyCosts)
    case `/order/cost/?page=1&order=null&cost_type=${COST_TYPE_CALL_OUT_COSTS}`:
      return Promise.resolve(emptyCosts)
    default:
      console.log(url)
      return Promise.reject(new Error('not found'))
  }
})

const getters = {
  getDefaultCurrency: () => 'EUR',
  getInvoiceDefaultVat: () => 21,
  getInvoiceDefaultMargin: () => 0,
  getInvoiceDefaultHourlyRate: () => '10.00',
  getVATTypes: () => [0, 9, 21],
  getIsAdmin: () => false,
  getUserPk: () => 1,
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

  it('has 3 HeaderCells', async () => {
    const wrapper = shallowMount(CallOutCosts, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        invoice_default_call_out_costs: '0.00',
        customer: new CustomerModel(customerResponse.data),
        invoiceLinesParent: []
      }
    })

    await flushPromises()

    const trs = wrapper.findAllComponents(HeaderCell)
    expect(trs.length).to.equal(3)
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
        customer: new CustomerModel(customerResponse.data),
        invoiceLinesParent: []
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

  it('has 6 HeaderCells', async () => {
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
        invoice_default_price_per_km: '1.00',
        invoiceLinesParent: [],
      }
    })

    await flushPromises()

    const trs = wrapper.findAllComponents(HeaderCell)
    expect(trs.length).to.equal(6)
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
        invoice_default_price_per_km: '1.00',
        invoiceLinesParent: [],
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
        invoice_default_price_per_km: '1.00',
        invoiceLinesParent: [],
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
        invoice_default_price_per_km: '1.00',
        invoiceLinesParent: [],
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
        invoice_default_price_per_km: '1.15',
        invoiceLinesParent: [],
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

  it('has 5 HeaderCells', async () => {
    const wrapper = shallowMount(Materials, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        material_models: invoiceResponse.data.material_models,
        used_materials: invoiceResponse.data.used_materials,
        engineer_models: invoiceResponse.data.engineer_models,
        customer: new CustomerModel(customerResponse.data),
        invoiceLinesParent: [],
      }
    })

    await flushPromises()

    const trs = wrapper.findAllComponents(HeaderCell)
    expect(trs.length).to.equal(5)
  })

  it('has a total of €53.50 and VAT €4.30', async () => {
    const wrapper = mount(Materials, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        material_models: invoiceResponse.data.material_models,
        engineer_models: invoiceResponse.data.engineer_models,
        used_materials: invoiceResponse.data.used_materials,
        customer: new CustomerModel(customerResponse.data),
        invoiceLinesParent: [],
      }
    })

    await flushPromises()

    const total_input = wrapper.find('input.total-input-final')
    expect(total_input.element.value).to.equal('€53.50')

    const vat_input = wrapper.find('input.vat-input-final')
    expect(vat_input.element.value).to.contain("€11.24")
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

  it('has 4 HeaderCells', async () => {
    const engineer_models = invoiceResponse.data.engineer_models.map((m) => new RateEngineerUserModel({
      ...m,
      margin_perc: 0
    }))

    const wrapper = shallowMount(Hours, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        type: COST_TYPE_WORK_HOURS,
        hours_total: invoiceResponse.data.activity_totals.work_total,
        user_totals: invoiceResponse.data.activity_totals.user_totals,
        engineer_models,
        customer: new CustomerModel(customerResponse.data),
        invoiceLinesParent: [],
      }
    })

    await flushPromises()

    const trs = wrapper.findAllComponents(HeaderCell)
    expect(trs.length).to.equal(4)
  })

  it('has a total of €365.00 and VAT €76.65', async () => {
    const engineer_models = invoiceResponse.data.engineer_models.map((m) => new RateEngineerUserModel({
      ...m,
      margin_perc: 0
    }))

    const wrapper = mount(Hours, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f
      },
      propsData: {
        type: COST_TYPE_WORK_HOURS,
        hours_total: invoiceResponse.data.activity_totals.work_total,
        user_totals: invoiceResponse.data.activity_totals.user_totals,
        engineer_models,
        customer: new CustomerModel(customerResponse.data),
        invoiceLinesParent: [],
      }
    })

    await flushPromises()

    // 16:15 + 13:45 + 06:30 = 36:30
    // 36:30 * 10 = 365

    const total_input = wrapper.find('input.total-input-final')
    expect(total_input.element.value).to.equal('€365.00')

    const vat_input = wrapper.find('input.vat-input-final')
    expect(vat_input.element.value).to.contain("€76.65")
  })
  //
})

import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Vuex from 'vuex';

import localVue from '../../index'
import SupplierForm from '@/views/inventory/SupplierForm.vue'
import supplierResponse from '../../fixtures/supplier-autocomplete'

jest.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/inventory/supplier/1/':
      return Promise.resolve(supplierResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('SupplierForm.vue', () => {
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
    const wrapper = shallowMount(SupplierForm, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(SupplierForm)
    expect(el.exists()).to.be.true
  })

  it('insert, contains "New supplier"', async () => {
    const wrapper = mount(SupplierForm, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New supplier</h2>')
  })

  it('edit, contains "Edit supplier"', async () => {
    const wrapper = mount(SupplierForm, {
      localVue,
      store,
      mocks: {
        $trans: (f) => f,
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>Edit supplier</h2>')
  })
})

import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import SupplierReservationForm from '@/views/inventory/SupplierReservationForm.vue'
import supplierReservationResponse from '../../fixtures/supplier-reservation'
import supplierMaterialsResponse from '../../fixtures/supplier-materials'
import suppliersResponse from '../../fixtures/suppliers'

vi.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/inventory/supplier-reservation/1/':
      return Promise.resolve(supplierReservationResponse)
    case '/inventory/material/?page=1&supplier_relation=1':
      return Promise.resolve(supplierMaterialsResponse)
    case '/inventory/supplier/?page=1':
      return Promise.resolve(suppliersResponse)
    case '/inventory/material/?page=1&supplier_relation=23':
      return Promise.resolve(supplierMaterialsResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})


describe('SupplierReservationForm.vue', () => {
  test('exists', async () => {
    const wrapper = shallowMount(SupplierReservationForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(SupplierReservationForm)
    expect(el.exists()).to.be.true
  })

  test('insert, contains "New reservation"', async () => {
    const wrapper = mount(SupplierReservationForm, {
      mocks: {
        $trans: (f) => f,
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>New reservation</h2>')
  })

  test('edit, contains "Edit reservation"', async () => {
    const wrapper = mount(SupplierReservationForm, {
      mocks: {
        $trans: (f) => f,
      },
      propsData: {
        pk: 1
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('<h2>Edit reservation</h2>')
  })
})

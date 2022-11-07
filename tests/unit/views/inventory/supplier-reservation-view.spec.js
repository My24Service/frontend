import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import SupplierReservationView from '@/views/inventory/SupplierReservationView.vue'
import supplierReservationViewResponse from '../../fixtures/supplier-reservation.js'

jest.mock('axios')

axios.get.mockImplementation((url) => {
  switch (url) {
    case '/inventory/supplier-reservation/1/':
      return Promise.resolve(supplierReservationViewResponse)
    default:
      return Promise.reject(new Error(`${url} not found`))
  }
})

const routes = [
]

const router = new VueRouter({routes})

describe('SupplierReservationView.vue', () => {
  it('has SupplierReservationView component', async () => {
    const wrapper = shallowMount(SupplierReservationView, {
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

    const el = wrapper.findComponent(SupplierReservationView)
    expect(el.exists()).to.be.true
  })

  it('has 3 material rows', async () => {
    const wrapper = mount(SupplierReservationView, {
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

    const trs = wrapper.findAll('#reservation-materials-table tbody tr')
    expect(trs.length).to.equal(3)
  })

  it('contains "Limoen Likeur"', async () => {
    const wrapper = mount(SupplierReservationView, {
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
    expect(html).to.contain('Limoen Likeur')
  })
})

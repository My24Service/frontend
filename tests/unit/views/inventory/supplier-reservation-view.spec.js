import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import SupplierReservationView from '@/views/inventory/SupplierReservationView.vue'
import supplierReservationViewResponse from '../../fixtures/supplier-reservation.js'

vi.mock('axios')

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
  test('has SupplierReservationView component', async () => {
    const wrapper = shallowMount(SupplierReservationView, {
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

  test('has 3 material rows', async () => {
    const wrapper = mount(SupplierReservationView, {
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
    expect(trs.length).toBe(3)
  })

  test('contains "Limoen Likeur"', async () => {
    const wrapper = mount(SupplierReservationView, {
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

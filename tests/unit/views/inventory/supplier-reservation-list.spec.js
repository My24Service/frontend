import axios from "axios"
import { describe, expect, vi, test } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import SupplierReservationList from '@/views/inventory/SupplierReservationList.vue'
import supplierReservationListResponse from '../../fixtures/supplier-reservations'

vi.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'supplier-reservation-edit'
},
  {
    path: '/hello/world',
    name: 'supplier-reservation-view'
  },
{
  path: '/hello/world',
  name: 'supplier-reservation-add'
},
{
  path: '/hello/world',
  name: 'purchaseorder-add-from-reservation'
},
]

const router = new VueRouter({routes})


describe('SupplierReservationList.vue', () => {
  test('exists', async () => {
    axios.get.mockResolvedValue(supplierReservationListResponse);

    const wrapper = shallowMount(SupplierReservationList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(SupplierReservationList)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(supplierReservationListResponse);

    const wrapper = mount(SupplierReservationList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#supplier-reservation-table > tbody > tr.reservation-row')
    expect(trs.length).toBe(2)
  })

  test('contains "My company" and "My company 2"', async () => {
    axios.get.mockResolvedValue(supplierReservationListResponse);

    const wrapper = mount(SupplierReservationList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('My company')
    expect(html).to.contain('My company 2')
  })
})

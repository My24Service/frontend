import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import SupplierReservationList from '@/views/inventory/SupplierReservationList.vue'
import supplierReservationListResponse from '../../fixtures/supplier-reservations'

jest.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'supplier-reservation-edit'
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
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(supplierReservationListResponse);

    const wrapper = shallowMount(SupplierReservationList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(SupplierReservationList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(supplierReservationListResponse);

    const wrapper = mount(SupplierReservationList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#supplier-reservation-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "My company" and "My company 2"', async () => {
    axios.get.mockResolvedValueOnce(supplierReservationListResponse);

    const wrapper = mount(SupplierReservationList, {
      localVue,
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

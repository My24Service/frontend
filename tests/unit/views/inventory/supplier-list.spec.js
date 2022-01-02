import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import SupplierList from '@/views/inventory/SupplierList.vue'
import supplierResponse from '../../fixtures/suppliers'

jest.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'supplier-add'
},
{
  path: '/hello/world',
  name: 'supplier-edit'
},
{
  path: '/hello/world',
  name: 'supplier-view'
},
]

const router = new VueRouter({routes})


describe('SupplierList.vue', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(supplierResponse);

    const wrapper = shallowMount(SupplierList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(SupplierList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(supplierResponse);

    const wrapper = mount(SupplierList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#supplier-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })

  it('contains "Edisonstraat" and "Wormerweg"', async () => {
    axios.get.mockResolvedValueOnce(supplierResponse);

    const wrapper = mount(SupplierList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const html = wrapper.html()
    expect(html).to.contain('Wormerweg')
    expect(html).to.contain('Edisonstraat')
  })
})

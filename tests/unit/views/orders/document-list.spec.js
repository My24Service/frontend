import axios from "axios"
import { expect } from 'chai'
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'

import localVue from '../../index'
import DocumentList from '@/views/orders/DocumentList.vue'
import documentsResponse from '../../fixtures/documents'

jest.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'order-document-edit'
},
{
  path: '/hello/world',
  name: 'order-document-add'
},
]

const router = new VueRouter({routes})


describe('DocumentList.vue', () => {
  it('exists', async () => {
    axios.get.mockResolvedValueOnce(documentsResponse);

    const wrapper = shallowMount(DocumentList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(DocumentList)
    expect(el.exists()).to.be.true
  })

  it('has two rows', async () => {
    axios.get.mockResolvedValueOnce(documentsResponse);

    const wrapper = mount(DocumentList, {
      localVue,
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#document-table > tbody > tr')
    expect(trs.length).to.equal(2)
  })
})

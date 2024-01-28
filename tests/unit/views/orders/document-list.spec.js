import axios from "axios"
import { shallowMount, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'
import { describe, expect, vi, test } from 'vitest'

import DocumentList from '@/views/orders/DocumentList.vue'
import documentsResponse from '../../fixtures/documents'

vi.mock('axios')

const routes = [
{
  path: '/hello/world',
  name: 'order-document-edit'
},
{
  path: '/hello/world',
  name: 'order-document-add'
},
  {
    path: '/hello/world',
    name: 'order-list'
  },
]

const router = new VueRouter({routes})


describe('DocumentList.vue', () => {
  test('exists', async () => {
    axios.get.mockResolvedValue(documentsResponse);

    const wrapper = shallowMount(DocumentList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const el = wrapper.findComponent(DocumentList)
    expect(el.exists()).to.be.true
  })

  test('has two rows', async () => {
    axios.get.mockResolvedValue(documentsResponse);

    const wrapper = mount(DocumentList, {
      router,
      mocks: {
        $trans: (f) => f
      },
    })

    await flushPromises()

    const trs = wrapper.findAll('#document-table > tbody > tr')
    expect(trs.length).toBe(2)
  })
})
